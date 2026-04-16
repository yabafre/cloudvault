# Product Requirements Document — CloudVault

**Author:** Alex
**Date:** 2026-03-20

## Executive Summary

CloudVault is a privacy-first cloud file storage platform targeting freelancers, creative professionals, and small business teams (3-10 people) who need secure file management with EU data residency, granular sharing controls, and transparent pricing. The platform enables direct file uploads to AWS S3 via pre-signed URLs, automatic thumbnail generation, and a responsive dashboard for file management. CloudVault fills the gap between expensive enterprise solutions (Box, SharePoint) and privacy-compromising consumer tools (Google Drive, Dropbox) while serving as a production-grade full-stack cloud architecture portfolio.

## Success Criteria

### User Outcomes

- Users can upload, view, and manage files from any device within 3 clicks
- Users trust the platform with sensitive files due to transparent security practices and EU hosting
- Small teams can collaborate on file management with clear permissions and activity tracking

### Business Outcomes

- Demonstrate production-grade full-stack cloud architecture competency (NestJS, Next.js, AWS, CI/CD)
- Attract 500 registered users within 3 months of public launch
- Achieve 10,000 uploaded files as proof of product-market fit

### Technical Outcomes

- API response times under 200ms at the 95th percentile
- 99.9% upload success rate for files under 10MB
- Automated CI/CD pipeline with lint, test, build, and deploy stages
- Backend test coverage above 80%

### Measurable Outcomes

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first upload | < 2 minutes from registration | Analytics event tracking |
| Upload success rate | > 99% for files < 10MB | S3 upload completion logs |
| Thumbnail generation latency | < 5 seconds | Lambda CloudWatch metrics |
| Frontend Largest Contentful Paint | < 2 seconds | Lighthouse CI |
| API p95 response time | < 200ms | API monitoring |
| Zero critical vulnerabilities | 0 active CVEs | Dependency scanning |

## Product Scope

### MVP (Phase 1)

**Authentication & User Management**
- Email/password registration and login
- OAuth social login (Google)
- Token-based session management with automatic refresh
- User profile with basic information

**File Upload & Storage**
- Direct-to-S3 file upload via pre-signed URLs
- Support for JPG, PNG, PDF, and WEBP formats up to 10MB
- File metadata persistence (name, type, size, timestamps)
- Server-side file type validation

**File Management**
- Paginated file listing (20 files per page) with metadata display
- File deletion with confirmation (S3 + database cleanup)
- Thumbnail preview for image files
- User dashboard with storage statistics

**Thumbnail Generation**
- Automatic 200x200px thumbnail creation for uploaded images
- Asynchronous processing via serverless function
- Error handling for unsupported or corrupted files

**Infrastructure**
- Responsive web interface (mobile + desktop)
- Dockerized deployment with CI/CD pipeline
- Health monitoring endpoint
- CDN and WAF protection

### Growth (Phase 2)

- File sharing with time-limited links and granular permissions (view-only, download restrictions)
- Folder organization with nested hierarchy
- Team workspaces with role-based access control (admin, editor, viewer)
- Usage quotas and subscription billing
- File search across metadata
- Activity audit logs

### Vision (Phase 3)

- End-to-end client-side encryption (zero-knowledge tier)
- AI-powered file tagging and duplicate detection
- Self-hosted Docker distribution for on-premise deployment
- Multi-region storage with transfer acceleration
- Public API with SDK and webhook support
- Mobile applications (React Native)

## User Journeys

### Journey 1: New User Registration and First Upload

1. Visitor lands on homepage and clicks "Get Started"
2. Visitor creates account with email/password or Google OAuth
3. System validates credentials and creates user profile
4. User is redirected to empty dashboard with upload prompt
5. User drags and drops an image file onto the upload zone
6. System generates pre-signed URL and uploads file directly to S3
7. System displays upload progress and confirms completion
8. Lambda generates thumbnail asynchronously
9. Dashboard refreshes to show the uploaded file with thumbnail, name, size, and date

### Journey 2: File Management Session

1. Authenticated user opens dashboard
2. Dashboard displays file grid with thumbnails and storage statistics
3. User browses files with pagination (20 per page)
4. User selects a file to view details (full metadata)
5. User decides to delete the file and confirms the action
6. System removes file from S3 and database, updates storage statistics
7. Dashboard reflects the updated file count and available storage

### Journey 3: Returning User with Expired Session

1. User navigates to dashboard with an expired access token
2. System detects expired token and automatically attempts refresh
3. If refresh token is valid: new access token is issued, user continues seamlessly
4. If refresh token is expired: user is redirected to login page with session expired message
5. User re-authenticates and returns to their previous dashboard state

## Domain Requirements

CloudVault stores user files and personal data in the EU (AWS eu-west-3, Paris), triggering the following compliance considerations:

- **GDPR (Articles 6, 15, 17, 32, 33)**: Lawful basis for processing is contract performance. Users must be able to export and delete their data. Encryption at rest and in transit is required. Breach notification within 72 hours.
- **Data Residency**: All user files and metadata stored in AWS eu-west-3 (Paris). Sub-processors (AWS, Cloudflare) must have signed Data Processing Agreements.
- **Privacy by Design**: Minimize data collection to what is strictly necessary for the service. No tracking of file access patterns for analytics purposes.
- **Right to Erasure**: File deletion must remove data from both S3 and PostgreSQL. Backup retention policies must respect deletion requests.

## Functional Requirements

### Authentication

FR1: Visitor can create an account with email and password
FR2: Visitor can create an account using Google OAuth
FR3: System can validate that email addresses are unique and properly formatted before account creation
FR4: System can enforce password requirements of minimum 8 characters at registration
FR5: User can authenticate with email and password to receive session credentials
FR6: User can authenticate via Google OAuth to receive session credentials
FR7: System can issue a short-lived access token and a long-lived refresh token upon successful authentication
FR8: System can automatically refresh an expired access token using a valid refresh token without user intervention
FR9: User can terminate their session, invalidating their current credentials
FR10: System can redirect unauthenticated users to the login page when accessing protected resources

### User Profile

FR11: User can view their profile information (name, email, registration date)
FR12: User can update their display name

### File Upload

FR13: User can upload a file by selecting it from a file browser dialog
FR14: User can upload a file by dragging and dropping it onto the upload zone
FR15: System can validate file type against allowed formats (JPG, PNG, PDF, WEBP) before upload
FR16: System can reject files exceeding the 10MB size limit with a clear error message
FR17: System can generate a temporary upload URL scoped to the authenticated user
FR18: System can upload the file directly to object storage without transiting through the application server
FR19: System can display upload progress percentage during file transfer
FR20: System can persist file metadata (original name, generated name, MIME type, size, storage key, timestamps) upon successful upload
FR21: System can validate file content type using file header bytes, not file extension alone

### Thumbnail Generation

FR22: System can automatically generate a 200x200 pixel thumbnail when an image file (JPG, PNG, WEBP) is uploaded
FR23: System can process thumbnail generation asynchronously without blocking the upload response
FR24: System can store generated thumbnails in a dedicated storage prefix
FR25: System can associate the thumbnail storage reference with the original file metadata
FR26: System can handle thumbnail generation failures gracefully without affecting the original file

### File Listing

FR27: User can view a paginated list of their uploaded files with 20 files per page
FR28: User can see file metadata for each file: name, type, size, upload date, and thumbnail preview
FR29: User can navigate between pages of their file list
FR30: System can display thumbnails inline for image files in the file list
FR31: System can show a placeholder icon for non-image files (PDF) in the file list

### File Deletion

FR32: User can delete one of their own files
FR33: System can request deletion confirmation before proceeding
FR34: System can remove the file from object storage and its metadata from the database in a single operation
FR35: System can remove the associated thumbnail from object storage when deleting an image file
FR36: System can prevent a user from deleting files owned by another user

### Dashboard

FR37: User can view a dashboard displaying their storage statistics: total file count, total space used, and last upload date
FR38: User can access the file upload zone directly from the dashboard
FR39: User can view their 5 most recently uploaded files on the dashboard
FR40: System can calculate and display storage usage in human-readable units (KB, MB, GB)

### Navigation & Layout

FR41: User can navigate between dashboard, file list, and profile pages
FR42: User can toggle between light and dark display modes
FR43: System can adapt the layout for mobile screens (< 768px), tablet screens (768-1024px), and desktop screens (> 1024px)
FR44: User can access the logout action from any authenticated page

### Health & Monitoring

FR45: System can expose a health check endpoint reporting database connectivity and object storage availability
FR46: System can return appropriate error responses with structured error messages for all API failures

## Non-Functional Requirements

### Performance

- The system shall respond to authenticated API requests within 200ms at the 95th percentile under normal load (up to 100 concurrent users)
- The system shall complete a 5MB file upload within 10 seconds on a 50 Mbps connection
- The system shall generate thumbnails within 5 seconds of file upload completion
- The system shall render the dashboard page with a Largest Contentful Paint under 2 seconds

### Security

- The system shall hash all passwords using argon2id (via `@node-rs/argon2`) with OWASP-recommended parameters (memoryCost ≥ 19 MiB, timeCost ≥ 2, parallelism 1)
- The system shall encrypt all data in transit using TLS 1.2 or higher
- The system shall encrypt all stored files at rest using AES-256 server-side encryption
- The system shall enforce CORS restrictions allowing only the frontend origin domain
- The system shall expire temporary upload URLs within 15 minutes of generation
- The system shall enforce rate limiting of 100 requests per minute per IP address on all API endpoints
- The system shall validate and sanitize all user inputs at the API boundary
- The system shall set Content-Security-Policy, X-Content-Type-Options, and Strict-Transport-Security headers on all responses

### Scalability

- The system shall support up to 100 concurrent authenticated users without performance degradation
- The system shall handle up to 100,000 stored files per user without query performance degradation
- The system shall support horizontal scaling of the API layer behind a load balancer

### Accessibility

- The system shall achieve WCAG 2.1 Level AA compliance on all public-facing pages
- The system shall support keyboard navigation for all interactive elements
- The system shall provide appropriate ARIA labels for screen reader compatibility on file management actions

### Integration

- The system shall expose a RESTful API conforming to OpenAPI 3.0 specification
- The system shall support OAuth 2.0 authorization code flow for Google authentication
- The system shall integrate with AWS S3 API (v3 SDK) for all object storage operations
- The system shall support PostgreSQL 16 as the primary data store
