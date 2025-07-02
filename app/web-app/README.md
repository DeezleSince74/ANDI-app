# Web App - ANDI Next.js Application

This directory contains the Next.js web application for ANDI.

## Overview

The ANDI web app provides:
- Server-side rendering for optimal performance
- Responsive design for all devices
- Audio recording and management
- AI-powered insights and coaching
- Community features
- Resource library

## Structure

```
web-app/
├── app/               # Next.js 13+ app directory
│   ├── components/    # Reusable components
│   ├── api/          # API routes
│   └── (routes)/     # Page routes
├── components/        # Shared components
├── lib/              # Utility functions
├── hooks/            # Custom React hooks
├── services/         # API services
├── store/            # State management
├── public/           # Static assets
└── styles/           # Global styles
```

## Tech Stack

- **Framework**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand / Context API
- **UI**: Custom components + Radix UI
- **Audio**: Web Audio API
- **Database**: PostgreSQL / Supabase
- **Analytics**: Custom analytics to ClickHouse

## Key Features

1. **Authentication Flow**
   - Sign up/Login
   - Password reset
   - Profile management

2. **Recording System**
   - Browser-based audio capture
   - Session management
   - Cloud storage integration

3. **Insights Dashboard**
   - AI-generated summaries
   - Performance metrics
   - Recommendations

4. **Community Features**
   - Teacher Lounge
   - Resource sharing
   - Peer support

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```