# DeepScholar Export System

A comprehensive, well-structured export system for DeepScholar that supports multiple formats, API access, and various data types.

## 📁 Directory Structure

```
src/lib/export/
├── index.ts                    # Main entry point and exports
├── types.ts                    # TypeScript interfaces and types
├── utils.ts                    # Utility functions
├── validators.ts               # Request validation and rate limiting
├── README.md                   # This documentation
├── formatters/                 # Text-based format converters
│   ├── index.ts               # Formatter registry and base interface
│   ├── markdown.ts            # Markdown formatter
│   ├── html.ts                # HTML formatter
│   ├── json.ts                # JSON formatter
│   ├── csv.ts                 # CSV formatter
│   └── txt.ts                 # Plain text formatter
├── generators/                 # Binary format generators
│   ├── index.ts               # Generator registry and base interface
│   ├── pdf.ts                 # PDF generator (placeholder)
│   └── docx.ts                # DOCX generator (placeholder)
└── services/
    └── ExportService.ts       # Main orchestration service
```

## 🚀 API Endpoints

```
src/app/api/export/
├── brief/[id]/route.ts        # Brief export endpoint
├── user/[id]/route.ts         # User profile export endpoint
└── search/route.ts            # Search results export endpoint (TODO)
```

## 🎯 User Interface

```
src/app/export/
└── page.tsx                   # Export center page for manual exports
```

## 🔧 Features

### Supported Export Types
- **Research Briefs** - Individual briefs with metadata, references, and content
- **User Profiles** - Complete user data including statistics and brief history
- **Search Results** - Search results with filters and metadata
- **Categories** - Category data (planned)
- **Collections** - Brief collections (planned)
- **Analytics** - Usage analytics (planned)

### Supported Export Formats
- **PDF** - Portable Document Format (placeholder implementation)
- **Markdown** - GitHub-flavored markdown
- **HTML** - Styled HTML with CSS
- **JSON** - Structured data format
- **CSV** - Comma-separated values for spreadsheets
- **DOCX** - Microsoft Word format (placeholder implementation)
- **TXT** - Plain text format

### Key Features
- **Rate Limiting** - 10 exports per hour per user
- **Validation** - Comprehensive request and data validation
- **Authentication** - Secure access control
- **Customization** - Flexible export options and styling
- **API Access** - RESTful API for programmatic access
- **User Interface** - Intuitive web interface for manual exports

## 📖 Usage Examples

### Manual Export via Web Interface
1. Navigate to `/export`
2. Select export type (Brief, User Profile, etc.)
3. Choose format (PDF, Markdown, JSON, etc.)
4. Configure options (include metadata, references, etc.)
5. Click export and download

### API Usage

#### Export a Brief as PDF
```bash
curl -X GET "https://your-domain.com/api/export/brief/brief-id?format=pdf&includeReferences=true" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -o "brief.pdf"
```

#### Export User Profile as JSON
```bash
curl -X GET "https://your-domain.com/api/export/user/user-id?format=json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -o "profile.json"
```

#### Complex Export with POST
```bash
curl -X POST "https://your-domain.com/api/export/brief/brief-id" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "pdf",
    "options": {
      "includeMetadata": true,
      "includeReferences": true,
      "styling": {
        "theme": "academic",
        "fontSize": 12
      }
    }
  }'
```

## 🏗️ Architecture

### Core Components

#### 1. ExportService
The main orchestrator that coordinates all export operations:
- Validates requests
- Fetches data
- Applies rate limiting
- Coordinates formatting/generation
- Handles errors and logging

#### 2. Formatters
Text-based format converters that implement the `Formatter` interface:
- `format(data, options)` - Convert data to string format
- `getMimeType()` - Return appropriate MIME type
- `getFileExtension()` - Return file extension

#### 3. Generators
Binary format generators that implement the `Generator` interface:
- `generate(data, options)` - Convert data to Buffer
- `getMimeType()` - Return appropriate MIME type
- `getFileExtension()` - Return file extension

#### 4. Validators
Request and data validation:
- Request structure validation
- Format and type validation
- Rate limiting enforcement
- File size validation

#### 5. Utilities
Helper functions for:
- Filename generation
- MIME type handling
- Data cleaning and sanitization
- Metadata generation

### Data Flow

1. **Request** → API endpoint receives export request
2. **Authentication** → Verify user session/token
3. **Validation** → Validate request parameters and options
4. **Rate Limiting** → Check user's export quota
5. **Data Fetching** → Retrieve data from database
6. **Data Cleaning** → Remove sensitive information
7. **Format Processing** → Apply appropriate formatter/generator
8. **Response** → Return file or download URL

## 🔒 Security Features

- **Authentication Required** - All exports require valid session
- **Rate Limiting** - 10 exports per hour per user
- **Data Sanitization** - Automatic removal of sensitive fields
- **Access Control** - Users can only export their own data (except admins)
- **Input Validation** - Comprehensive request validation
- **File Size Limits** - Maximum 50MB per export

## 🚧 Implementation Status

### ✅ Completed
- Core export system architecture
- All text-based formatters (Markdown, HTML, JSON, CSV, TXT)
- Request validation and rate limiting
- API endpoints for briefs and user profiles
- User interface for manual exports
- Authentication and access control

### 🔄 In Progress
- Integration with actual database services
- Real export functionality in UI

### 📋 TODO
- PDF and DOCX generators (currently placeholders)
- Search results export endpoint
- Export history tracking in database
- Email notifications for large exports
- Bulk export operations
- Export templates and customization
- Analytics and usage tracking

## 🛠️ Development

### Adding a New Format

1. **Create Formatter/Generator**
```typescript
// src/lib/export/formatters/xml.ts
export class XmlFormatter implements Formatter {
  getMimeType(): string { return 'application/xml'; }
  getFileExtension(): string { return '.xml'; }
  async format(data: any, options?: any): Promise<string> {
    // Implementation
  }
}
```

2. **Register in Service**
```typescript
// src/lib/export/services/ExportService.ts
import { xmlFormatter } from '../formatters/xml';

FormatterRegistry.register('xml', xmlFormatter);
```

3. **Update Types**
```typescript
// src/lib/export/types.ts
export type ExportFormat = 
  | 'pdf' | 'markdown' | 'html' | 'json' | 'csv' | 'docx' | 'txt' | 'xml';
```

### Adding a New Export Type

1. **Define Data Interface**
```typescript
// src/lib/export/types.ts
export interface NewTypeExportData {
  id: string;
  // ... other fields
}
```

2. **Update Export Types**
```typescript
export type ExportType = 
  | 'brief' | 'user_profile' | 'search_results' | 'new_type';
```

3. **Add API Endpoint**
```typescript
// src/app/api/export/new-type/[id]/route.ts
// Implementation similar to existing endpoints
```

4. **Update Service**
```typescript
// Add data fetching logic in ExportService.fetchData()
```

## 📊 Monitoring

The system includes built-in logging and monitoring:
- Export activity logging
- Rate limiting tracking
- Error reporting
- Performance metrics
- Usage analytics

## 🤝 Contributing

When contributing to the export system:

1. Follow the established patterns and interfaces
2. Add comprehensive TypeScript types
3. Include proper error handling
4. Add validation for new parameters
5. Update documentation
6. Consider security implications
7. Test with various data sizes and formats

## 📝 Notes

- **Placeholder Implementations**: PDF and DOCX generators are currently placeholders. In production, integrate with libraries like Puppeteer (PDF) or docx (DOCX).
- **Database Integration**: The service currently uses mock data. Replace with actual database calls using existing DeepScholar services.
- **File Storage**: Consider implementing file storage for large exports instead of direct download.
- **Caching**: Add caching for frequently exported data to improve performance.
- **Async Processing**: For large exports, consider implementing background job processing.

This export system provides a solid foundation that can be extended and customized based on specific requirements while maintaining security, performance, and usability.
