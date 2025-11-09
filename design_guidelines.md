# Design Guidelines: UID Bypass Management Platform

## Design Approach
**System-Based Approach** - Modern dashboard design inspired by Linear, Vercel Dashboard, and Stripe Dashboard, emphasizing clarity, efficiency, and professional aesthetics for admin-focused workflows.

## Core Design Principles
- **Clarity First**: Data-driven interface prioritizing readability and quick access to critical information
- **Professional Elegance**: Sophisticated dark mode interface with subtle accent animations
- **Efficient Workflows**: Minimize clicks, maximize information density without clutter
- **Security-Conscious**: Clear visual hierarchy that reinforces security features

## Color Palette

### Dark Mode (Primary)
- **Background Base**: 222 15% 8% (Deep charcoal)
- **Background Elevated**: 222 15% 11% (Slightly lighter panels)
- **Background Accent**: 222 15% 14% (Hover states, cards)
- **Primary Brand**: 271 91% 65% (Vibrant purple - matches Discord bot aesthetic)
- **Success**: 142 76% 36% (Green for confirmations)
- **Warning**: 38 92% 50% (Amber for alerts)
- **Danger**: 0 84% 60% (Red for destructive actions)
- **Text Primary**: 210 40% 98% (Almost white)
- **Text Secondary**: 215 20% 65% (Muted gray)
- **Border**: 217 19% 27% (Subtle borders)

### Light Mode (Secondary)
- **Background**: 0 0% 100%
- **Background Elevated**: 240 10% 98%
- **Primary**: 271 91% 55%
- **Text**: 222 47% 11%

## Typography
- **Headings**: Inter (600-700 weight) - Clean, modern sans-serif
- **Body**: Inter (400-500 weight)
- **Monospace**: JetBrains Mono - For UIDs, API keys, code snippets
- **Scale**: text-xs (11px), text-sm (14px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px), text-3xl (30px)

## Layout System
**Spacing Units**: Consistently use p-4, p-6, p-8, gap-4, gap-6 for major spacing. Use p-2, p-3 for compact elements.

### Dashboard Structure
- **Sidebar Navigation**: Fixed left, w-64, collapsible to w-16 (icon-only)
- **Main Content**: ml-64, full-height scrollable area
- **Top Bar**: Fixed, h-16, contains user profile, notifications, quick actions
- **Content Max Width**: max-w-7xl for wide layouts, max-w-4xl for forms

## Component Library

### Navigation
- **Sidebar**: Dark elevated background with subtle glow on active items
- **Active State**: Left border accent (4px) + background tint + primary color text
- **Icons**: Lucide icons, 20px size, consistent spacing

### Cards & Panels
- **Standard Card**: Elevated background, border, rounded-lg (8px), p-6
- **Stat Cards**: Grid layout (3-4 columns), compact p-4, large numbers (text-3xl), labels (text-xs uppercase)
- **Hover Effect**: Subtle border color shift, no shadow changes (cleaner aesthetic)

### Tables
- **Header**: Sticky top-0, background-elevated, text-xs uppercase tracking-wide, text-secondary
- **Rows**: border-b, hover:bg-accent transition, p-4 vertical padding
- **Actions Column**: Right-aligned, icon buttons group
- **Pagination**: Bottom, centered, showing range + controls

### Forms
- **Input Fields**: h-10, px-3, rounded-md, border, focus:ring-2 ring-primary/20
- **Labels**: text-sm font-medium mb-2
- **API Key Display**: Monospace font, bg-elevated, border, copy button integrated
- **Form Sections**: Space with gap-6, group related fields

### Buttons
- **Primary**: bg-primary, text-white, hover:brightness-110, h-10, px-6, rounded-md
- **Secondary**: border, hover:bg-accent, transparent background
- **Destructive**: bg-danger variant
- **Icon Only**: Square aspect, p-2, rounded-md

### Modals/Dialogs
- **Overlay**: bg-black/60 backdrop-blur-sm
- **Content**: max-w-lg, bg-elevated, rounded-lg, p-6
- **Header**: Border-bottom, pb-4, mb-4
- **Actions**: Right-aligned, gap-3, mt-6

### Pricing Cards
- **Layout**: Grid 5 columns on desktop (24h, 3d, 7d, 14d, 30d)
- **Popular Badge**: Absolute top-right, bg-primary, text-xs, rounded-full, px-3, py-1
- **Price**: text-3xl font-bold, with $ symbol
- **Duration**: text-sm text-secondary
- **Select Button**: Full width, mt-4

### User Management Table
- **Columns**: Username, User ID, Credits, Status, Last Active, Actions
- **Credit Display**: Badge with color (green >100, amber 50-100, red <50)
- **Status Indicator**: Dot + text (Active/Suspended)
- **Quick Actions**: Edit credits, View activity, Suspend/Activate

## Particle Animation
- **Implementation**: tsParticles library via CDN
- **Style**: Subtle white/purple particles, slow floating motion
- **Density**: Low (30-50 particles max) - background accent, not distraction
- **Placement**: Login page full-screen, dashboard header only
- **Performance**: RequestAnimationFrame, paused when tab inactive

## Smooth Transitions
- **Page Transitions**: Fade in content (300ms ease-in-out)
- **Micro-interactions**: Scale buttons on click (95%), color transitions (150ms)
- **Loading States**: Skeleton screens (pulse animation) instead of spinners
- **Navigation**: Slide-fade for route changes (200ms)
- **Avoid**: Heavy parallax, excessive motion (accessibility concern)

## Authentication Pages
- **Login Page**: Centered card (max-w-md), particle background, logo top, form below
- **Card Style**: Elevated, glass-morphism effect (backdrop-blur-xl, bg-elevated/90)
- **Branding**: Centered logo/title at top, tagline below
- **Form Layout**: Single column, generous spacing (gap-4)

## Dashboard Views

### Overview Page
- **Top Row**: 4 stat cards (Total Users, Active Credits, UIDs Today, Revenue)
- **Middle**: Recent activity table (compact, 10 rows)
- **Right Sidebar**: Quick actions panel + API status indicator

### User Management
- **Search Bar**: Top, full-width, with filters dropdown
- **Table**: Main content, sortable columns, row actions
- **Bulk Actions**: Top-right when rows selected

### UID Creation
- **Form Layout**: Two-column (UID input + duration selector)
- **Pricing Preview**: Dynamic card showing selected price
- **Credit Check**: Real-time validation, visual feedback
- **Success Modal**: Confirmation with UID details, copy button

### Settings Panel
- **Tabs**: API Configuration, Security, Preferences
- **API Section**: Base URL input, API key (masked with reveal), test connection button
- **Security**: Password change, session management, activity log

## Images
- **Hero Image**: None (utility dashboard doesn't need hero)
- **Login Background**: Gradient mesh (purple/blue) with particle overlay
- **Empty States**: Simple illustrations for "no data" states
- **Icons Only**: Lucide icon library for all UI icons

## Responsive Behavior
- **Desktop (1024px+)**: Full sidebar, multi-column layouts
- **Tablet (768px-1023px)**: Collapsed sidebar (icon-only), 2-column grids
- **Mobile (<768px)**: Hidden sidebar (hamburger menu), single column, bottom nav for key actions

## Security Visual Indicators
- **Masked Values**: API keys show first/last 4 chars with asterisks, eye icon to reveal
- **Secure Badges**: Lock icon + "Encrypted" text on sensitive fields
- **Session Timer**: Countdown indicator in top bar before auto-logout
- **2FA Prompt**: Modal overlay requiring re-authentication for sensitive actions