# UID Management System

## Overview
Professional UID management system with external API integration for managing user identities and bypass services.

## Recent Changes (November 2025)
- **Complete UI Redesign**: Transformed from flashy purple/cyan theme to professional dark theme with deep charcoals and steel blues
- **Removed Animations**: Eliminated particle effects, gradient animations, and floating elements for professional appearance
- **Professionalized Language**: Removed all casual language and "TRYHARD" references
- **MongoDB Integration**: Connected to MongoDB database for data persistence
- **API Client Update**: Aligned with external UID Bypass API documentation

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + MongoDB (Mongoose)
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Authentication**: Session-based with express-session

## Key Features
- User management (admin only)
- UID creation with duration-based pricing
- Credit system for users
- Activity logging
- External API integration for UID bypass services
- Dark mode interface

## Color Scheme
- **Background**: Deep charcoal (222 15% 8%)
- **Cards**: Elevated dark (220 15% 11%)
- **Primary**: Professional blue (215 90% 60%)
- **Text**: High contrast (210 20% 92%)
- **Borders**: Subtle (217 15% 18%)

## Database
- MongoDB with Mongoose ODM
- Collections: users, settings, uids, activityLogs, plans
- Connection via MONGODB_URI environment variable

## External API
- Base URL and API Key configured in Settings
- Supports: add UID, remove UID, list UIDs, renew UID
- Uses X-API-Key header authentication

## Pricing Tiers
- 1 Day (24h): $0.50
- 2 Days (48h): $0.80
- 3 Days (72h): $1.30 (Popular)
- 5 Days (120h): $2.00
- 7 Days (168h): $2.33
- 30 Days (720h): $5.20
- 60 Days (1440h): $9.50

## Default Admin
- Username: admin
- Password: admin123 (CHANGE AFTER FIRST LOGIN!)

## User Preferences
- Professional, minimal design
- Dark theme by default
- No flashy animations or effects
- Clear, readable typography
- Data-focused interface
