# ANDI Web App TODO List

## Required Setup Tasks

### Authentication & Security
- [ ] **Sign up for Sentry** - Create account and get DSN for error monitoring
- [ ] **Get Google OAuth credentials** - Set up Google Cloud Console project and get client ID/secret
- [ ] **Get Azure Entra ID OAuth credentials** - Set up Azure AD app registration and get client ID/secret
- [ ] **Configure email provider** - Set up SMTP or email service for magic link authentication
- [ ] **Set up production environment variables** - Update .env for production deployment

### Database & Infrastructure
- [ ] **Set up production database** - Configure PostgreSQL database for production
- [ ] **Set up ClickHouse warehouse** - Configure data warehouse for analytics
- [ ] **Configure Drizzle migrations** - Set up database schema and run migrations
- [ ] **Set up Redis for sessions** - Configure session storage for production

### Deployment & DevOps
- [ ] **Choose hosting platform** - Vercel, AWS, or other platform for Next.js deployment
- [ ] **Set up CI/CD pipeline** - GitHub Actions or similar for automated deployments
- [ ] **Configure domain and SSL** - Set up custom domain with HTTPS
- [ ] **Set up monitoring and logging** - Configure application monitoring beyond Sentry

### Ollama Local LLM Integration (PRIORITY - Next Session)
- [ ] **Test complete ANDI stack** - Run `./start-andi.sh --detached` and verify all 4 services start
- [ ] **Download and setup Ollama models** - Run `cd app/open-llm-app && make setup-models` (~30GB download)
- [ ] **Test Ollama API** - Verify Meta Llama models respond correctly with `make test`
- [ ] **Import Langflow sample flows** - Load CIQ analysis and teacher coaching flows into Langflow IDE
- [ ] **Test Langflow-Ollama integration** - Validate custom components work with local LLM models
- [ ] **Add Ollama model selection to web app** - Create UI toggle for local vs external AI analysis
- [ ] **Integrate Ollama endpoints in API routes** - Update recording analysis to support local LLM option
- [ ] **Add model status indicators** - Show Ollama service health and loaded models in dashboard

### Application Features  
- [ ] **Implement dashboard functionality** - Build out the main app interface after signin
- [ ] **Add audio recording/upload features** - Core ANDI classroom analysis functionality
- [ ] **Implement CIQ framework calculations** - Build the Classroom Impact Quotient analysis (can now use local Ollama models)
- [ ] **Create user profile and settings** - Allow users to manage their accounts
- [ ] **Add data visualization components** - Charts and graphs for classroom insights

### Dashboard Mock Data (Replace with Real Data)
- [ ] **Replace classroom activities mock data** - Connect to database/datawarehouse for "Try this in your classroom" section
- [ ] **Replace achievements mock data** - Connect to user progress tracking system
- [ ] **Replace trivia questions mock data** - Connect to content management system
- [ ] **Add performance gauge charts** - Implement actual CIQ scoring visualization (Overall Performance)
- [ ] **Add domain performance donut chart** - Implement Equity/Creativity/Innovation breakdown visualization
- [ ] **Add framework performance chart** - Implement detailed CIQ framework performance metrics
- [ ] **Connect upload/record buttons to actual functionality** - Implement file upload and audio recording features

### Testing & Quality
- [ ] **Add unit tests** - Test core functionality with Jest/Vitest
- [ ] **Extend E2E tests** - Add more Playwright tests for full user flows
- [ ] **Add accessibility testing** - Automated a11y testing in CI/CD
- [ ] **Performance optimization** - Bundle analysis and performance improvements
- [ ] **Set up CI/CD environment for tests** - Configure production OAuth credentials for GitHub Actions
- [ ] **Configure test database for CI** - Set up test database or implement mocks for automated testing
- [ ] **Re-enable GitHub Actions workflow** - Uncomment automatic triggers once CI environment is ready

### Legal & Compliance
- [ ] **Review and finalize Terms of Service** - Legal review of current terms
- [ ] **Review and finalize Privacy Policy** - Ensure COPPA/FERPA compliance for education
- [ ] **Add cookie consent** - GDPR compliance if serving EU users
- [ ] **Security audit** - Third-party security review before production

### Documentation
- [ ] **Create deployment documentation** - Step-by-step production setup guide
- [ ] **Document environment variables** - Complete list of required config
- [ ] **User onboarding flow** - Help docs and tutorials for new users
- [ ] **API documentation** - If exposing APIs for integrations

## Notes
- Current app uses placeholder OAuth credentials that need to be replaced
- Sentry integration is configured but needs real DSN
- Email provider configuration is required for magic link authentication
- All production environment variables need to be set up

## Recent Progress (July 14, 2025)
- ✅ **Ollama Local LLM Integration Complete** - Full infrastructure setup with Meta Llama models
- ✅ **ANDI Stack Enhanced** - Now includes: database + web-app + Langflow + Ollama
- ✅ **Privacy-First AI Architecture** - All educational data can now be processed locally
- ✅ **Langflow Custom Components** - ANDI-specific Ollama components and sample flows created
- ✅ **Startup Script Integration** - Ollama included in `./start-andi.sh` orchestration

**Next Session Focus**: Test complete stack, download models, and begin Langflow flow development