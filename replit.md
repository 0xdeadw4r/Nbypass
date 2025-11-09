# TRYHARD UID BYPASS

## Overview

A professional web-based UID bypass management platform with a Discord bot integration. The system provides credit-based user management, UID creation/tracking, activity logging, and administrative controls through a modern dashboard interface. Built as a full-stack TypeScript application with Express backend and React frontend.

**Core Purpose**: Enable administrators to manage UID bypass services through a secure web dashboard while integrating with Discord for bot-based operations. Users can purchase and manage UIDs with different durations, tracked through a credit system.

**Branding**: TRYHARD UID BYPASS with custom yellow/black/white wolf logo.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server

**UI Component System**: 
- Radix UI primitives for accessible, unstyled components
- shadcn/ui design system with "new-york" style preset
- TailwindCSS for utility-first styling with custom theme extending base colors
- Dark mode primary with light mode secondary support

**State Management**:
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod for form validation
- Local session storage for authentication state persistence

**Routing**: Wouter for lightweight client-side routing

**Design System**:
- Professional dashboard aesthetic inspired by Linear, Vercel, and Stripe
- Purple primary brand color (271 91% 65%) matching Discord bot theme
- Particle animation background using tsParticles
- Custom font stack: Inter for UI, JetBrains Mono for monospace content

**Key Pages**:
- Login - Authentication entry point
- Dashboard - Overview statistics and recent activity
- Users - User management (owner only)
- Create UID - UID creation with pricing tiers
- Credits - Credit management system (owner only)
- Settings - API configuration (owner only)
- Activity - Comprehensive activity logging

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful JSON API with session-based authentication

**Authentication & Authorization**:
- bcrypt for password hashing (10 rounds)
- Express session middleware with HTTP-only cookies
- CSRF protection via SameSite cookie policy
- Role-based access control (owner vs regular users)
- Session secret configurable via environment variable

**Middleware Stack**:
- `requireAuth` - Validates user session exists
- `requireOwner` - Restricts endpoints to owner accounts only
- JSON body parsing with raw body capture for webhook verification
- Request/response logging with duration tracking

**Data Layer**: 
- Drizzle ORM for type-safe database operations
- Neon serverless PostgreSQL driver with WebSocket support
- Database abstraction through `IStorage` interface pattern
- Migration system via drizzle-kit

**Seeding Strategy**: Default owner account creation (username: "admin", password: "itsmeuidbypass") with unlimited credits (999999.99)

### Database Schema

**Tables**:

1. **users** - User accounts with credit balances
   - Fields: id (UUID), username (unique), password (hashed), isOwner (boolean), credits (decimal), isActive (boolean), timestamps
   - Supports owner and regular user roles

2. **settings** - System configuration
   - Fields: id (UUID), baseUrl, apiKey, updatedAt
   - Single-row configuration for external API integration

3. **uids** - Created UID records
   - Fields: id (UUID), userId (FK), uidValue, duration (hours), cost (decimal), status, createdAt, expiresAt
   - Cascade delete on user removal
   - Status values: active, expired, deleted

4. **activityLogs** - Audit trail of all operations
   - Fields: id (UUID), userId (FK), action, details, createdAt
   - Actions: login, create_uid, delete_uid, update_uid, credit_add, credit_deduct, user_created
   - Cascade delete on user removal

**Relationships**:
- One-to-Many: users → uids
- One-to-Many: users → activityLogs

**Data Types**: 
- Decimal(10,2) for monetary values ensuring precision
- Integer for duration in hours
- Timestamps for temporal tracking
- Text for flexible string storage

### External Dependencies

**Database**: 
- Neon Serverless PostgreSQL (via @neondatabase/serverless package)
- Connection via DATABASE_URL environment variable
- WebSocket support for real-time capabilities

**Third-Party Services**:
- External UID bypass API: https://uidbypass.com/public/api/bypassapi.php
- API Key: uid_94fb2e07f08e2869a46d5bf2fc135af5 (configured in database)
- Real-time API integration for UID creation and deletion
- Discord bot integration (Python-based, separate codebase)

**Discord Bot Integration**:
- Located in attached_assets directory (Python Discord.py)
- Uses USD_API_KEY for authentication with external service
- Bot owner ID and command prefix configurable
- Database integration for user authorization checking

**Development Tools**:
- tsParticles CDN for particle animations (v2.12.0)
- Google Fonts API for Inter and JetBrains Mono fonts
- Replit development plugins (cartographer, dev banner, runtime error overlay)

**Environment Variables Required**:
- DATABASE_URL - PostgreSQL connection string
- SESSION_SECRET - Express session encryption key (defaults provided for development)
- NODE_ENV - Environment identifier (development/production)

**Pricing Tiers**: Fixed duration/cost structure
- 24 hours: $0.50
- 72 hours: $1.30
- 168 hours: $2.33
- 336 hours: $3.50
- 720 hours: $5.20

**Session Management**: 
- 24-hour session expiration
- Secure cookies in production
- HTTP-only and SameSite strict policies

## Recent Changes

**Date:** October 23, 2025

### External API Integration
- Created `server/api-client.ts` - External UID bypass API client
- Integrated real UID creation with https://uidbypass.com/public/api/bypassapi.php
- Added UID deletion via external API
- Pre-configured API settings in database

### Authentication Enhancements
- Fixed TypeScript session typing in `server/middleware.ts`
- Added `/api/auth/me` endpoint for current user data
- Improved login response parsing in frontend

### Database
- PostgreSQL database provisioned and configured
- Schema pushed to database successfully
- Admin account seeded (username: admin, password: itsmeuidbypass)
- Settings table populated with API credentials

### Documentation
- Added `README-VSCODE.md` for local development setup
- Comprehensive VS Code setup instructions
- Environment variable configuration guide