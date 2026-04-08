# Product Brief: CloudVault

## Executive Summary

CloudVault is a privacy-first, developer-friendly cloud file storage and sharing platform built on AWS infrastructure. It targets tech-savvy individuals, freelancers, and small businesses who need secure file management with transparent pricing, EU data residency, and granular sharing controls — without the complexity of self-hosted solutions like Nextcloud or the privacy trade-offs of Google Drive and Dropbox. The project also serves as a full-stack cloud architecture portfolio demonstrating expertise across NestJS, Next.js, AWS, CI/CD, and DevOps best practices.

## Core Vision

### Problem Statement

Current cloud storage solutions force users to choose between convenience (Dropbox, Google Drive) and privacy (Nextcloud, Tresorit). Mainstream providers track user data, lock users into ecosystems, and offer opaque pricing. Self-hosted alternatives require significant DevOps knowledge and ongoing maintenance. There is no middle ground for privacy-conscious professionals who want a managed, affordable, and transparent file storage solution.

### Problem Impact

- 48% of cloud storage users report concerns about privacy and data ownership
- 41% are frustrated by pricing complexity and unexpected upgrade costs
- 38% find file sharing permissions inadequate (no time-limited links, no download restrictions, no audit trails)
- Freelancers and small teams (3-10 people) are underserved: enterprise solutions (Box at $22/user/mo) are too expensive, while consumer tools lack admin controls and compliance features
- GDPR compliance is mandatory for EU users, yet most mainstream providers store data outside the EU

### Proposed Solution

A managed SaaS platform that combines:
- **Direct S3 uploads** via pre-signed URLs (no server transit, fast and scalable)
- **EU data residency** (AWS eu-west-3, Paris) with GDPR compliance by default
- **Transparent security** — encryption at rest (AES-256) and in transit (TLS 1.3+)
- **Granular file sharing** — time-limited links, view-only mode, download tracking
- **Automatic thumbnail generation** via serverless Lambda processing
- **Simple, predictable pricing** — free tier (5GB) + team plans ($5/user/mo)

### Key Differentiators

1. **Privacy-first by default** — EU hosting, no data tracking, transparent privacy policy (vs. Google/Dropbox data harvesting)
2. **Developer-friendly** — REST API with OpenAPI docs, webhook support, clean codebase (open-source portfolio)
3. **Managed simplicity** — No DevOps required (vs. Nextcloud), with optional self-hosted Docker deployment path for power users
4. **Transparent pricing** — No hidden fees, no ecosystem lock-in, usage clearly tracked
5. **Portfolio value** — Demonstrates production-grade full-stack cloud architecture (AWS S3, Lambda, EC2, CI/CD, monitoring)

## Target Users

### Primary Users

**Freelancers & Creative Professionals** (67% of target)
- Designers, photographers, developers who need to store and share large files (images, PSDs, code archives) with clients
- Currently using: Google Drive free tier + WeTransfer for large files
- Pain: No granular permissions, unprofessional sharing experience, privacy concerns
- Technical level: Comfortable with web apps, not interested in self-hosting

**Small Business Teams** (28% of target)
- Agencies and startups (3-10 people) needing shared file storage with admin controls
- Currently using: Google Workspace or Dropbox Business (finding it expensive or insufficient)
- Pain: Box/SharePoint too complex and expensive, Dropbox lacks audit trails, no EU compliance guarantees
- Technical level: Mixed; need simple onboarding with team management features

### Secondary Users

**Privacy-Conscious Developers** (5% of niche)
- Open-source advocates, security researchers, developers building integrations
- Value: API access, self-hosting option, transparent codebase
- Role: Early adopters, community contributors, word-of-mouth amplifiers

**Project Evaluators / Recruiters**
- Technical hiring managers, portfolio reviewers assessing the author's cloud architecture expertise
- Value: Code quality, architecture decisions, DevOps practices, documentation

### User Journey

1. **Discovery** — Finds CloudVault via dev communities (GitHub, Dev.to, Indie Hackers), privacy-focused content, or portfolio review
2. **Sign Up** — Creates account with email/password or Google OAuth; gets 5GB free storage
3. **First Upload** — Drags and drops files; sees instant thumbnail generation; experiences fast S3 direct upload
4. **Share Files** — Creates time-limited sharing links with view-only or download permissions
5. **Team Adoption** — Invites team members; manages permissions via dashboard; tracks file activity
6. **Upgrade** — Hits free tier limit; upgrades to paid plan ($5/user/mo) for more storage and team features

## Success Metrics

### Business Objectives

- **Portfolio Goal**: Demonstrate production-grade full-stack cloud architecture with CI/CD, monitoring, and security best practices
- **Product Goal**: Build a functional SaaS that solves real file storage pain points for freelancers and small teams
- **Community Goal**: Create a well-documented open-source project that attracts contributors and showcases best practices

### KPIs

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Registered users | 500 | 3 months post-launch |
| Files uploaded | 10,000 | 3 months post-launch |
| API response time (p95) | < 200ms | Ongoing |
| Upload success rate (5MB file) | > 99% | Ongoing |
| Thumbnail generation time | < 5s | Ongoing |
| Frontend LCP | < 2s | Ongoing |
| GitHub stars | 100 | 6 months post-launch |
| Test coverage (backend) | > 80% | Before v1.0 release |
| CI/CD pipeline success rate | > 95% | Ongoing |
| Zero critical security vulnerabilities | 0 CVEs | Ongoing |

## MVP Scope

### Core Features

1. **User Authentication**
   - Email/password registration and login with JWT + refresh tokens
   - Google OAuth integration
   - Protected routes with automatic token refresh
   - Profile management

2. **File Upload & Storage**
   - Direct upload to S3 via pre-signed URLs (max 10MB per file)
   - Supported formats: JPG, PNG, PDF, WEBP
   - File metadata stored in PostgreSQL (name, type, size, timestamps)
   - Server-side file type validation (magic bytes, not extension)

3. **File Management**
   - List files with pagination (20 per page)
   - Display: filename, type, size, upload date, thumbnail preview
   - Delete files (S3 + database cleanup)
   - User dashboard with stats (total files, space used, last upload)

4. **Automatic Thumbnail Generation**
   - S3 ObjectCreated trigger → Lambda function
   - 200x200px thumbnail generation for images
   - Async processing with error handling

5. **Responsive Web Interface**
   - Mobile-first responsive design
   - Drag-and-drop upload zone
   - File grid/list view toggle
   - Dark mode support

6. **Infrastructure & DevOps**
   - Dockerized deployment (API + Web)
   - GitHub Actions CI/CD (lint, test, build, deploy)
   - Health check endpoint (DB + S3 connectivity)
   - Cloudflare CDN/WAF protection
   - HTTPS everywhere

### Out of Scope

- File sharing between users (v2.0)
- Folder organization and tags (v2.0)
- Payment processing and subscriptions (v2.0)
- End-to-end client-side encryption (v2.0)
- Mobile native application (v2.0)
- File versioning (v2.0)
- Real-time collaboration/editing (v2.0)
- Self-hosted Docker distribution (v2.0)
- Full-text file search (v2.0)
- Virus scanning / malware detection (v2.0)
- Multi-region replication (v2.0)
- Admin dashboard (v2.0)

### Success Criteria

The MVP is validated when:
- [ ] A user can register, login, and manage their profile
- [ ] A user can upload images/PDFs (< 10MB) directly to S3
- [ ] Thumbnails are generated automatically within 10 seconds
- [ ] A user can view their files with thumbnails and metadata
- [ ] A user can delete their own files
- [ ] The API responds in < 500ms (p95)
- [ ] The frontend is responsive on mobile and desktop
- [ ] Code is linted, tested, and documented
- [ ] CI/CD pipeline deploys automatically on merge to main
- [ ] Application is accessible via HTTPS with Cloudflare protection

### Future Vision

**v2.0 — Sharing & Collaboration**
- File sharing with expirable links and granular permissions
- Folder organization with drag-and-drop
- Team workspaces with role-based access (admin, editor, viewer)
- Usage quotas and billing (Stripe integration)

**v3.0 — Intelligence & Scale**
- AI-powered file tagging and duplicate detection
- Full-text search across file metadata
- Client-side encryption option (zero-knowledge tier)
- Self-hosted Docker image for on-premise deployment
- Multi-region S3 with Transfer Acceleration

**Infrastructure Evolution**
- Migrate from EC2 t3.micro to ECS Fargate or serverless (Lambda + API Gateway)
- PostgreSQL → RDS Aurora Serverless v2 for auto-scaling
- Replace Lambda Python thumbnails with Lambda Node.js + Sharp.js (faster, cheaper)
- Add Redis for token blacklisting and session caching
- Implement S3 Intelligent-Tiering and lifecycle policies for cost optimization
