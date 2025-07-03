# ANDI Web App - Next.js 15 Application

The ANDI AI Instructional Coach web application built with Next.js 15, TypeScript, and modern web technologies.

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: ShadCN/UI + Radix UI
- **Authentication**: Auth.js v5 (NextAuth.js)
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tool**: Turbopack (development)
- **Monitoring**: Sentry
- **State Management**: Zustand (when needed)

## 📁 Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   │   └── auth/          # NextAuth.js routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main app dashboard
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/                # ShadCN UI components
│   ├── auth/              # Authentication components
│   └── dashboard/         # Dashboard components
├── lib/                   # Utility functions
│   └── utils.ts           # Shared utilities
├── server/                # Server-side code
│   ├── auth/              # NextAuth.js configuration
│   └── db/                # Database schema and connection
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── env.js                 # Environment variable validation
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- PostgreSQL database (running via ANDI database setup)

### Environment Setup

1. **Copy environment variables:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update environment variables in `.env.local`:**
   ```bash
   DATABASE_URL="postgresql://andi_user:andi_password@localhost:5432/andi_db"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Generate NextAuth secret:**
   ```bash
   openssl rand -base64 32
   ```

### Installation & Development

```bash
# Install dependencies
npm install

# Generate database migrations
npm run db:generate

# Push database schema
npm run db:migrate

# Start development server with Turbopack
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🔐 Authentication

### Auth.js v5 Configuration

- **Email Provider**: Magic link authentication
- **Google OAuth**: Social authentication
- **Database Sessions**: Stored in PostgreSQL
- **Custom User Fields**: Teacher-specific data (school, subjects, etc.)

### User Schema Extensions

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  role: string;                    // "teacher", "admin", "coach"
  schoolId?: string;               // Reference to school
  districtId?: string;             // Reference to district
  gradeLevels?: string[];          // ["K", "1", "2", etc.]
  subjects?: string[];             // ["Math", "Reading", etc.]
  yearsExperience?: number;        // Teaching experience
  certificationLevel?: string;     // Certification status
  preferences?: Record<string, any>; // User preferences
  isActive: boolean;               // Account status
}
```

## 🎨 UI Components (ShadCN)

### Available Components

- **Button**: Multiple variants and sizes
- **Dialog**: Modal dialogs
- **Dropdown Menu**: Context menus
- **Avatar**: User profile images
- **Tabs**: Tabbed interfaces
- **Label**: Form labels
- **Select**: Dropdown selects

### Adding New Components

```bash
# Install a new ShadCN component
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add input
```

## 🗄️ Database Integration

### Drizzle ORM Setup

- **Schema**: `src/server/db/schema.ts`
- **Connection**: `src/server/db/index.ts`
- **Config**: `drizzle.config.ts`

### Web App Specific Tables

- `andi_web_user` - Extended user profiles
- `andi_web_account` - OAuth accounts
- `andi_web_session` - User sessions
- `andi_web_user_session` - App-specific sessions
- `andi_web_user_preference` - User preferences
- `andi_web_audit_log` - Activity logs

### Database Commands

```bash
# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio

# Seed development data
npm run db:seed
```

## 🔌 ANDI Services Integration

### Service Connections

```typescript
// Environment variables for service integration
LANGFLOW_API_URL="http://localhost:7860/api/v1"    // AI Workflows
CLICKHOUSE_URL="http://localhost:8123"             // Analytics
AIRFLOW_API_URL="http://localhost:8080/api/v1"     // Data Pipelines
```

### API Integration Points

- **Langflow**: AI workflow execution and management
- **ClickHouse**: Analytics data and reporting
- **Airflow**: Data pipeline monitoring
- **Main Database**: Real-time data access

## 📊 Monitoring & Observability

### Sentry Integration

```typescript
// Automatic error tracking and performance monitoring
SENTRY_DSN="your-sentry-dsn"
SENTRY_ENVIRONMENT="development"
```

### Features Monitored

- **Page Load Performance**: Core Web Vitals
- **API Response Times**: Server-side performance
- **User Interactions**: Click tracking and navigation
- **Error Tracking**: Client and server errors
- **Authentication Events**: Sign-in/out tracking

## 🚀 Deployment

### Build Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build

# Start production server
npm start
```

### Environment Variables (Production)

```bash
DATABASE_URL="postgresql://user:pass@prod-db:5432/andi_db"
NEXTAUTH_URL="https://app.andilabs.ai"
NEXTAUTH_SECRET="secure-production-secret"
SENTRY_ENVIRONMENT="production"
```

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📦 Key Features

### Authentication Flow
- Email magic link sign-in
- Google OAuth integration
- Teacher profile setup
- Role-based access control

### Dashboard
- CIQ session management
- AI coaching insights
- Performance analytics
- Resource library access

### Recording System
- Browser-based audio capture
- Session metadata tracking
- Cloud storage integration
- Real-time transcription

### AI Integration
- Langflow workflow execution
- Real-time coaching suggestions
- Automated analysis results
- Performance recommendations

## 🔧 Development Tools

- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Turbopack**: Fast development builds
- **Drizzle Studio**: Database management
- **Bundle Analyzer**: Build optimization

## 📚 Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Auth.js Documentation](https://authjs.dev)
- [ShadCN/UI Components](https://ui.shadcn.com)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use ShadCN components for UI
3. Implement proper error handling
4. Add Sentry monitoring for new features
5. Write tests for critical paths
6. Follow Next.js App Router patterns