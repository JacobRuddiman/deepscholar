# DeepScholar Deployment Guide

This guide covers deploying DeepScholar to production environments.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Environment variables configured
- Domain name (optional)

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/deepscholar"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="https://yourdomain.com"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Local Mode (development only)
NEXT_PUBLIC_LOCAL_AUTH="false"  # Set to "true" to bypass authentication
NEXT_PUBLIC_LOCAL_MODE="false"  # Set to "true" for local development mode
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login and deploy
   vercel login
   vercel
   ```

2. **Configure Environment Variables**
   - Go to your Vercel project settings
   - Add all environment variables from your `.env` file
   - Ensure `NEXTAUTH_URL` points to your Vercel domain

3. **Configure Database**
   - Set up a PostgreSQL database (Vercel Postgres, Supabase, or Railway)
   - Add `DATABASE_URL` to environment variables
   - Run migrations:
     ```bash
     npx prisma migrate deploy
     ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Docker

1. **Build Docker Image**
   ```bash
   docker build -t deepscholar .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="postgresql://..." \
     -e NEXTAUTH_SECRET="..." \
     -e NEXTAUTH_URL="https://yourdomain.com" \
     deepscholar
   ```

3. **Using Docker Compose**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://postgres:password@db:5432/deepscholar
         - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
         - NEXTAUTH_URL=${NEXTAUTH_URL}
       depends_on:
         - db

     db:
       image: postgres:15
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: password
         POSTGRES_DB: deepscholar
       volumes:
         - postgres_data:/var/lib/postgresql/data

   volumes:
     postgres_data:
   ```

   Run with:
   ```bash
   docker-compose up -d
   ```

### Option 3: Manual Server Deployment

1. **Prepare Server**
   ```bash
   # Install Node.js, PostgreSQL, and PM2
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql
   sudo npm install -g pm2
   ```

2. **Clone and Build**
   ```bash
   git clone <your-repo-url>
   cd deepscholar/deepscholar
   npm install
   npm run build
   ```

3. **Set Up Database**
   ```bash
   # Run migrations
   npx prisma migrate deploy

   # (Optional) Seed initial data
   npm run db:seed
   ```

4. **Start with PM2**
   ```bash
   pm2 start npm --name "deepscholar" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx (optional)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Database Setup

### Run Migrations

```bash
npx prisma migrate deploy
```

### Seed Initial Data (Optional)

```bash
npm run db:seed
```

### Database Backups

Set up automated backups for your PostgreSQL database:

```bash
# Backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_file.sql
```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Run database migrations
- [ ] Test authentication flow
- [ ] Verify file uploads work (if applicable)
- [ ] Check health endpoints: `/api/health` and `/api/health/detailed`
- [ ] Set up monitoring (error tracking, performance monitoring)
- [ ] Configure automated backups
- [ ] Set up SSL/HTTPS
- [ ] Configure CDN for static assets (optional)
- [ ] Set up rate limiting at reverse proxy level

## Monitoring

### Health Check Endpoints

- **Basic**: `GET /api/health`
- **Detailed**: `GET /api/health/detailed`

### Recommended Monitoring Tools

- **Error Tracking**: Sentry, Bugsnag
- **Performance**: Vercel Analytics, New Relic
- **Uptime**: UptimeRobot, Pingdom
- **Logs**: LogRocket, Datadog

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Check migration status
npx prisma migrate status
```

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Memory Issues

If you encounter out-of-memory errors:

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **NEXTAUTH_SECRET**: Generate a strong secret
3. **Database**: Use strong passwords and restrict network access
4. **HTTPS**: Always use SSL in production
5. **Rate Limiting**: Implement at reverse proxy or CDN level
6. **CORS**: Configure allowed origins appropriately

## Scaling

### Horizontal Scaling

DeepScholar is stateless and can be horizontally scaled:

1. Deploy multiple instances
2. Use a load balancer (Nginx, AWS ALB, etc.)
3. Share session data via database or Redis

### Database Scaling

- Use connection pooling (already configured)
- Consider read replicas for heavy read workloads
- Implement caching layer (Redis) for frequently accessed data

## Rollback Procedure

If deployment fails:

```bash
# Revert to previous version
vercel rollback  # For Vercel

# Or rollback database migration
npx prisma migrate resolve --rolled-back <migration-name>
```

## Support

For deployment issues, check:
- GitHub Issues
- Documentation
- Community Discord (if available)
