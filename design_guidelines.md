# Design Guidelines: UID Management System

## Design Approach
**Professional Dashboard** - Clean, modern interface inspired by Linear, Vercel, and Stripe dashboards, emphasizing clarity, efficiency, and data-driven workflows.

## Core Design Principles
- **Clarity First**: Data-focused interface prioritizing readability and quick information access
- **Professional Aesthetics**: Refined dark mode with subtle, purposeful accents
- **Efficient Workflows**: Minimal clicks, maximum productivity
- **Security-Conscious**: Clear visual hierarchy reinforcing security features

## Color Palette

### Dark Mode (Primary)
- **Background Base**: 222 15% 8% (Deep charcoal)
- **Background Elevated**: 220 15% 11% (Panels and cards)
- **Background Accent**: 220 15% 18% (Hover states)
- **Primary Brand**: 215 90% 60% (Professional blue)
- **Success**: 150 65% 50% (Green for confirmations)
- **Warning**: 30 85% 60% (Amber for alerts)
- **Danger**: 0 70% 58% (Red for destructive actions)
- **Text Primary**: 210 20% 92% (High contrast)
- **Text Secondary**: 215 12% 60% (Muted text)
- **Border**: 217 15% 18% (Subtle borders)

### Light Mode (Secondary)
- **Background**: 210 20% 98%
- **Background Elevated**: 210 15% 97%
- **Primary**: 215 90% 55%
- **Text**: 215 25% 15%

## Typography
- **Headings**: System font stack (SF Pro, Segoe UI, Roboto) - 600-700 weight
- **Body**: System fonts - 400-500 weight
- **Monospace**: SF Mono, Monaco, Roboto Mono - For UIDs, API keys, code
- **Scale**: 11px, 14px, 16px, 18px, 20px, 24px, 30px

## Layout System
**Spacing**: Consistent use of 1rem, 1.5rem, 2rem for major spacing. 0.5rem, 0.75rem for compact elements.

### Dashboard Structure
- **Sidebar Navigation**: Fixed left, collapsible
- **Main Content**: Full-height scrollable area
- **Top Bar**: Optional, contains user profile and quick actions
- **Content Max Width**: max-w-7xl for wide layouts, max-w-4xl for forms

## Component Library

### Navigation
- **Sidebar**: Elevated background with clear active states
- **Active State**: Background tint + primary color text
- **Icons**: Lucide icons, 20px size, consistent spacing

### Cards & Panels
- **Standard Card**: Elevated background, border, rounded corners, padding
- **Stat Cards**: Grid layout, compact padding, large numbers, small labels
- **Hover Effect**: Subtle background elevation, no dramatic transitions

### Tables
- **Header**: Background elevated, small uppercase text, secondary color
- **Rows**: Border bottom, hover background, consistent padding
- **Actions Column**: Right-aligned, icon buttons
- **Pagination**: Bottom, centered, showing range and controls

### Forms
- **Input Fields**: Consistent height, padding, rounded corners, focus ring
- **Labels**: Small font, medium weight, margin bottom
- **API Key Display**: Monospace font, elevated background, copy button
- **Form Sections**: Grouped related fields with spacing

### Buttons
- **Primary**: Primary color background, white text, subtle hover
- **Secondary**: Border, transparent background, hover elevation
- **Destructive**: Danger color variant
- **Icon Only**: Square aspect, consistent padding, rounded

### Modals/Dialogs
- **Overlay**: Semi-transparent dark background
- **Content**: Max width, elevated background, rounded corners, padding
- **Header**: Border bottom, padding, margin
- **Actions**: Right-aligned, consistent spacing, margin top

## Interactions
- **Hover**: Subtle elevation changes only, no color shifts
- **Active**: Slightly deeper elevation
- **Transitions**: Fast (150ms) for responsiveness
- **Focus States**: Clear ring around focusable elements

## Authentication Pages
- **Login Page**: Centered card, clean background, logo, form
- **Card Style**: Elevated, subtle border, consistent with theme
- **Branding**: Centered logo at top, simple tagline
- **Form Layout**: Single column, generous spacing

## Dashboard Views

### Overview Page
- **Top Row**: 4 stat cards (metrics overview)
- **Middle**: Recent activity list (compact, 10 rows)
- **Quick Actions**: Common tasks panel

### User Management
- **Search**: Top, full-width, optional filters
- **Table**: Main content, sortable columns, row actions
- **Bulk Actions**: Available when rows selected

### UID Creation
- **Form Layout**: Two-column (input + duration selector)
- **Pricing Display**: Dynamic preview showing selected price
- **Credit Check**: Real-time validation
- **Success**: Confirmation with details

### Settings Panel
- **Sections**: API Configuration, Security
- **API Section**: Base URL input, API key (masked), test button
- **Security**: Password change, session management

## Responsive Behavior
- **Desktop (1024px+)**: Full sidebar, multi-column layouts
- **Tablet (768px-1023px)**: Collapsed sidebar, 2-column grids
- **Mobile (<768px)**: Hidden sidebar (hamburger menu), single column

## Security Visual Indicators
- **Masked Values**: Show first/last 4 characters, eye icon to reveal
- **Secure Badges**: Lock icon on sensitive fields
- **Session Timer**: Optional countdown before auto-logout

## Animation Policy
- **Minimal Animations**: Only use for functional feedback
- **Transitions**: Fast, subtle, purposeful
- **NO Particle Effects**: Removed for professional appearance
- **NO Gradient Animations**: Static colors only
- **NO Floating Elements**: All elements static and predictable
