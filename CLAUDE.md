# ANDI Project Context

## Project Overview
ANDI Labs is building an AI Instructional Coach platform - "Your favorite teacher's favorite teacher." The platform transforms classroom audio data into actionable insights, making effective instructional coaching scalable, affordable, and accessible to all educators.

## Core Innovation: The CIQ Framework
The Classroom Impact Quotient (CIQ) is ANDI's proprietary metric that:
- Uses multi-directional microphones to capture classroom conversations
- Combines multiple data sources: SIS/LMS integration (50%), surveys (20%), and ECI Blueprint indicators (30%)
- Employs AI to analyze teaching effectiveness across three pillars:
  - **Equity**: Ensuring psychological safety, access, and voice for all students
  - **Creativity**: Fostering self-expression, experimentation, and skill development
  - **Innovation**: Connecting learning to real-world impact and continuous improvement
- Presents insights through a "Learning Landscape" visualization instead of judgmental scores

## Problem & Impact
ANDI addresses critical educational challenges:
- Only 25% of teachers receive regular feedback
- 65%+ of students lack essential problem-solving skills
- Significant educational inequity based on demographics
- Makes the teacher-student engagement connection measurable and actionable

## Technical Architecture
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Node.js with API routes
- **Database**: PostgreSQL (application data) + ClickHouse (data warehouse)
- **AI Stack**: Assembly AI for transcription, OpenAI/Anthropic/Gemini for insights, RAG for contextualized recommendations
- **Authentication**: Auth.js v5 (NextAuth) with Google OAuth, Azure Entra ID, Email magic links
- **Storage**: Cloud storage for media files
- **Testing**: Playwright E2E tests with accessibility testing (axe-playwright)
- **Monitoring**: Sentry integration ready
- **Deployment**: GitHub Actions workflow (currently disabled until production OAuth setup)

## Key Features
1. **Audio Recording & Analysis**: Browser-based recording with automated transcription and analysis
2. **CIQ Scoring**: Dynamic scoring system that adapts to individual teacher needs
3. **Personalized Coaching**: AI-generated recommendations based on session analysis
4. **Community Features**: Teacher Lounge for peer support, resource library
5. **Analytics Dashboard**: Real-time metrics with historical trend analysis
6. **Gamification**: Achievement system and progress tracking

## Market Strategy
- Target: 1.9M U.S. middle/high school teachers in $140B EdTech market
- Go-to-market: Pilot programs, freemium model, district partnerships
- Initial focus on Maryland with TEDCO funding support

## Current Implementation Status (July 2025)
### ✅ Completed
- **Next.js 15 web application** with production-ready authentication system
- **Three auth providers**: Google OAuth, Azure Entra ID, Email magic links
- **ShadCN UI component library** with education-focused login design
- **WCAG AA accessibility compliance** with proper color contrast ratios
- **Comprehensive E2E testing** with Playwright and accessibility testing
- **Accurate ANDI branding** and homepage copy based on actual functionality
- **Glass morphism UI design** with optimized background image and transparency
- **Font size optimization** for improved readability across all components

### 🚧 Next Steps (see TODO.md)
- Sign up for Sentry and get production OAuth credentials
- Configure email provider for magic link authentication
- Set up production database and hosting platform
- Implement core ANDI features (audio analysis, CIQ framework)
- Enable GitHub Actions workflow once production environment is ready

## Development Guidelines
- Follow existing code conventions and patterns
- Prioritize teacher experience and data privacy
- Ensure all AI recommendations are research-backed and non-evaluative
- Test audio processing features thoroughly
- Maintain accessibility standards for educational software
- **Use slate color palette for consistent UI design** (Reference: https://ui.shadcn.com/colors)
- Keep login form at 50% transparency for glass morphism effect
- Apply ShadCN slate color scheme throughout all components and interfaces