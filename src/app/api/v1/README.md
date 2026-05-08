# DeepScholar Public API v1

## Overview

Base URL: `/api/v1`

All endpoints are **read-only GET requests**. No authentication required.

### Response Envelope

Every response follows this shape:

```json
// Success
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-05-08T12:00:00.000Z"
}

// Error
{
  "success": false,
  "error": { "message": "..." },
  "timestamp": "2026-05-08T12:00:00.000Z"
}
```

### Rate Limiting

All API routes are rate-limited via middleware. Exceeding the limit returns `429 Too Many Requests`.

---

## Common Object Shapes

### BriefSummary

Returned by list endpoints (`/briefs`, `/briefs/trending`, `/briefs/recent`, `/briefs/search`, `/users/:id/briefs`, `/categories/:id/briefs`).

```json
{
  "id": "clx1abc...",
  "title": "Transformer Architecture Advances",
  "abstract": "A comprehensive overview of...",
  "slug": "transformer-advances",
  "viewCount": 150,
  "readTime": 8,
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-16T12:00:00.000Z",
  "author": {
    "id": "clx2def...",
    "name": "Alice Researcher",
    "image": "https://example.com/alice.jpg"
  },
  "model": {
    "id": "clx3ghi...",
    "name": "GPT-4",
    "provider": "OpenAI"
  },
  "categories": [
    { "id": "clx4jkl...", "name": "Machine Learning" }
  ],
  "_count": {
    "reviews": 5,
    "upvotes": 12
  }
}
```

### BriefDetail

Returned by `/briefs/:id`. Includes full content and sources.

```json
{
  "id": "clx1abc...",
  "title": "Transformer Architecture Advances",
  "abstract": "A comprehensive overview of...",
  "prompt": "Explain recent transformer improvements",
  "response": "Recent advances include sparse attention...",
  "slug": "transformer-advances",
  "viewCount": 150,
  "readTime": 8,
  "accuracy": 0.92,
  "referencesText": "See Nature 2024...",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-16T12:00:00.000Z",
  "author": {
    "id": "clx2def...",
    "name": "Alice Researcher",
    "image": "https://example.com/alice.jpg"
  },
  "model": {
    "id": "clx3ghi...",
    "name": "GPT-4",
    "provider": "OpenAI"
  },
  "categories": [
    { "id": "clx4jkl...", "name": "Machine Learning" }
  ],
  "sources": [
    { "id": "clx5mno...", "title": "Nature Journal", "url": "https://nature.com/..." }
  ],
  "_count": {
    "reviews": 5,
    "upvotes": 12
  }
}
```

Fields **not** exposed: `rawHtml`, `thinking`, `conversationTurns` (internal).

### Review

```json
{
  "id": "clx6pqr...",
  "content": "Excellent overview!",
  "rating": 5,
  "createdAt": "2026-01-17T14:00:00.000Z",
  "author": {
    "id": "clx7stu...",
    "name": "Bob Scholar",
    "image": "https://example.com/bob.jpg"
  }
}
```

### Pagination

Paginated endpoints accept `page` and `limit` and return:

```json
{
  "total": 462,
  "page": 1,
  "limit": 20,
  "totalPages": 24
}
```

| Parameter | Type | Default | Range |
|-----------|------|---------|-------|
| `page` | integer | `1` | 1 -- 500 |
| `limit` | integer | `20` | 1 -- 100 |

Values outside the range are clamped (not rejected).

---

## Endpoints

### GET /api/v1/stats

Platform-wide totals. Counts only published briefs.

**Parameters:** None

**Example:**

```bash
curl /api/v1/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "briefs": 462,
    "users": 103,
    "reviews": 4272,
    "categories": 23
  }
}
```

**Errors:** `500` on server error.

---

### GET /api/v1/briefs

Paginated list of published briefs.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `page` | integer | `1` | Page number (1--500) |
| `limit` | integer | `20` | Results per page (1--100) |
| `sort` | string | `recent` | Sort order: `recent`, `popular`, `top-rated` |

Sort behavior:
- `recent` -- newest first (`createdAt` descending)
- `popular` -- most viewed first (`viewCount` descending)
- `top-rated` -- most reviewed first (review count descending)

**Examples:**

```bash
# First page, default sort
curl /api/v1/briefs

# Page 2, 10 per page, most popular
curl "/api/v1/briefs?page=2&limit=10&sort=popular"

# Top-rated briefs
curl "/api/v1/briefs?sort=top-rated"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "briefs": [ BriefSummary, ... ],
    "total": 462,
    "page": 1,
    "limit": 20,
    "totalPages": 24
  }
}
```

**Errors:** `500` on server error.

---

### GET /api/v1/briefs/trending

Top briefs by view count. Not paginated.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | integer | `10` | Number of results (1--50) |

**Examples:**

```bash
# Top 10 trending
curl /api/v1/briefs/trending

# Top 5
curl "/api/v1/briefs/trending?limit=5"

# Maximum (50)
curl "/api/v1/briefs/trending?limit=50"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "briefs": [ BriefSummary, ... ]
  }
}
```

**Errors:** `500` on server error.

---

### GET /api/v1/briefs/recent

Latest published briefs. Not paginated.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | integer | `10` | Number of results (1--50) |

**Examples:**

```bash
# Latest 10
curl /api/v1/briefs/recent

# Latest 3
curl "/api/v1/briefs/recent?limit=3"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "briefs": [ BriefSummary, ... ]
  }
}
```

**Errors:** `500` on server error.

---

### GET /api/v1/briefs/search

Full-text search across brief titles and abstracts.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `q` | string | *required* | Search query (minimum 2 characters) |
| `page` | integer | `1` | Page number (1--500) |
| `limit` | integer | `20` | Results per page (1--100) |
| `sort` | string | `recent` | Sort order: `recent`, `popular`, `top-rated` |
| `category` | string | -- | Filter by category ID |
| `model` | string | -- | Filter by model ID |

Search matches against `title` and `abstract` fields (case-insensitive on PostgreSQL).

**Examples:**

```bash
# Basic search
curl "/api/v1/briefs/search?q=neural+networks"

# Search within a category
curl "/api/v1/briefs/search?q=climate&category=clx4jkl..."

# Search with model filter, sorted by popularity
curl "/api/v1/briefs/search?q=transformer&model=clx3ghi...&sort=popular"

# Paginated search
curl "/api/v1/briefs/search?q=quantum&page=2&limit=5"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "briefs": [ BriefSummary, ... ],
    "total": 31,
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "query": "neural networks"
  }
}
```

**Errors:**
- `400` -- `Query parameter "q" is required and must be at least 2 characters`
- `500` -- server error

---

### GET /api/v1/briefs/:id

Single brief with full content. Looks up by ID or slug.

**Path parameter:** `id` -- brief ID (cuid) or slug string.

**Parameters:** None

**Examples:**

```bash
# By ID
curl /api/v1/briefs/clx1abc...

# By slug
curl /api/v1/briefs/transformer-advances
```

**Response:**

```json
{
  "success": true,
  "data": {
    "brief": BriefDetail
  }
}
```

**Errors:**
- `404` -- `Brief not found` (ID/slug doesn't exist, or brief is unpublished/draft/inactive)
- `500` -- server error

Draft and inactive briefs return 404 -- they are not accessible via this endpoint.

---

### GET /api/v1/briefs/:id/reviews

Reviews for a specific brief. Looks up brief by ID or slug.

**Path parameter:** `id` -- brief ID (cuid) or slug string.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `page` | integer | `1` | Page number (1--500) |
| `limit` | integer | `20` | Results per page (1--100) |

Reviews are ordered newest first.

**Examples:**

```bash
# All reviews for a brief (by slug)
curl /api/v1/briefs/transformer-advances/reviews

# Paginated
curl "/api/v1/briefs/clx1abc.../reviews?page=1&limit=5"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reviews": [ Review, ... ],
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Errors:**
- `404` -- `Brief not found`
- `500` -- server error

---

### GET /api/v1/users/:id

Public user profile. Does not expose email, admin status, or notification settings.

**Path parameter:** `id` -- user ID (cuid).

**Parameters:** None

**Example:**

```bash
curl /api/v1/users/clx2def...
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx2def...",
      "name": "Alice Researcher",
      "image": "https://example.com/alice.jpg",
      "createdAt": "2025-06-01T00:00:00.000Z",
      "briefCount": 15,
      "reviewCount": 42
    }
  }
}
```

`briefCount` only counts published briefs. `reviewCount` counts all reviews.

**Errors:**
- `404` -- `User not found`
- `500` -- server error

---

### GET /api/v1/users/:id/briefs

Published briefs by a specific user.

**Path parameter:** `id` -- user ID (cuid).

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `page` | integer | `1` | Page number (1--500) |
| `limit` | integer | `20` | Results per page (1--100) |
| `sort` | string | `recent` | Sort order: `recent`, `popular` |

**Examples:**

```bash
# User's briefs, newest first
curl /api/v1/users/clx2def.../briefs

# Most popular, 5 per page
curl "/api/v1/users/clx2def.../briefs?sort=popular&limit=5"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "briefs": [ BriefSummary, ... ],
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

Only published briefs are returned. Drafts and inactive briefs are excluded.

**Errors:**
- `404` -- `User not found`
- `500` -- server error

---

### GET /api/v1/categories

All categories with published brief counts, ordered by count descending.

**Parameters:** None

**Example:**

```bash
curl /api/v1/categories
```

**Response:**

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "clx4jkl...",
        "name": "Technology",
        "description": "Comprehensive insights and analysis...",
        "briefCount": 106
      },
      ...
    ]
  }
}
```

**Errors:** `500` on server error.

---

### GET /api/v1/categories/:id/briefs

Published briefs in a category. Looks up category by ID or name.

**Path parameter:** `id` -- category ID (cuid) or category name (exact match).

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `page` | integer | `1` | Page number (1--500) |
| `limit` | integer | `20` | Results per page (1--100) |
| `sort` | string | `recent` | Sort order: `recent`, `popular`, `top-rated` |

**Examples:**

```bash
# By category ID
curl /api/v1/categories/clx4jkl.../briefs

# By category name
curl /api/v1/categories/Technology/briefs

# Sorted by popularity, 10 per page
curl "/api/v1/categories/Technology/briefs?sort=popular&limit=10"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "briefs": [ BriefSummary, ... ],
    "total": 106,
    "page": 1,
    "limit": 20,
    "totalPages": 6
  }
}
```

**Errors:**
- `404` -- `Category not found`
- `500` -- server error

---

### GET /api/v1/models

AI models used on the platform with published brief counts, ordered by count descending.

**Parameters:** None

**Example:**

```bash
curl /api/v1/models
```

**Response:**

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "clx3ghi...",
        "name": "GPT-4",
        "provider": "OpenAI",
        "briefCount": 230
      },
      {
        "id": "clx8vwx...",
        "name": "Claude-3",
        "provider": "Anthropic",
        "briefCount": 229
      }
    ]
  }
}
```

**Errors:** `500` on server error.
