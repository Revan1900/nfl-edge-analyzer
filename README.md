# NFL Analytics Pro

An AI-powered NFL analytics platform providing data-driven insights, predictions, and analysis for informational purposes.

## 🚀 Features

### Core Functionality
- **Real-time Game Analysis**: AI-powered predictions with confidence scores
- **Historical Performance**: Track model accuracy and performance metrics
- **Interactive Dashboard**: Visualize trends and statistics
- **User Selections**: Save and track your favorite picks
- **PDF Reports**: Export detailed game analysis
- **Text-to-Speech**: Listen to AI-generated narratives

### Admin Features
- Data source management
- User submission moderation
- System health monitoring
- Performance analytics dashboard

### Security & Compliance
- GDPR/CCPA compliant data export
- Secure authentication with Row-Level Security
- Privacy policy and terms of service
- Cookie consent management
- Account deletion functionality

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (Lovable Cloud)
- **Database**: PostgreSQL with Row-Level Security
- **Edge Functions**: Deno runtime
- **AI/ML**: OpenAI GPT-5, Custom prediction models
- **Data Sources**: Odds API, Injury data, Weather data
- **Charts**: Recharts
- **UI Components**: shadcn/ui, Radix UI

## 📋 Project Structure

```
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── contexts/        # React contexts
│   └── integrations/    # Supabase integration
├── supabase/
│   ├── functions/       # Edge functions
│   └── migrations/      # Database migrations
├── public/              # Static assets
└── docs/               # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Lovable Cloud account (includes Supabase)
- OpenAI API key
- Odds API key

### Installation

1. Clone the repository (via Lovable or GitHub)
2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Configure environment variables (handled by Lovable Cloud):
   - `OPENAI_API_KEY`
   - `ODDS_API_KEY`

4. Run locally:
```bash
npm run dev
# or
bun dev
```

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy
1. Connect your project to Lovable Cloud
2. Configure secrets in project settings
3. Deploy with one click
4. Optional: Add custom domain

## 🧪 Testing

See [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) for complete testing checklist.

### Key Test Areas
- Authentication flows
- Public and protected pages
- Admin functionality
- Edge function execution
- Security & authorization
- Performance & responsiveness

## 📊 System Architecture

### Data Pipeline
1. **Ingestion**: Odds API → injuries → weather data
2. **Feature Engineering**: Build analytical features
3. **Prediction**: Generate ML predictions with confidence
4. **Calibration**: Evaluate model performance
5. **Narratives**: AI-generated analysis via OpenAI

### Edge Functions
- `orchestrator`: Runs entire pipeline
- `ingest-odds`: Fetch betting odds
- `ingest-injuries`: Fetch injury reports
- `ingest-weather`: Fetch weather data
- `build-features`: Feature engineering
- `generate-predictions`: ML predictions
- `calibrate-model`: Model evaluation
- `generate-narratives`: AI narratives
- `generate-pdf`: PDF report generation
- `generate-tts`: Text-to-speech audio
- `alert-monitor`: System health monitoring
- `health-check`: System status endpoint
- `export-user-data`: GDPR data export

## 🔒 Security

- Row-Level Security (RLS) on all tables
- Role-based access control (admin, moderator, user)
- Input validation and sanitization
- Rate limiting on public endpoints
- CSRF protection
- Secure password hashing
- API keys stored as secrets

## 📝 API Documentation

### Health Check
```bash
GET /functions/v1/health-check
```

Returns system health status including:
- Database connectivity
- Data freshness
- Source health
- Recent predictions

### Orchestrator
```bash
POST /functions/v1/orchestrator
Authorization: Bearer [ANON_KEY]
```

Runs the complete data pipeline.

## 🎯 Performance

- Page load < 3 seconds
- Edge functions < 5 seconds
- Web Vitals optimized
- Lazy loading implemented
- Database queries optimized

## ⚠️ Important Disclaimers

**THIS PLATFORM IS FOR INFORMATIONAL PURPOSES ONLY**
- NOT gambling or betting advice
- NOT financial advice
- Predictions are statistical models, not guarantees
- Users must be 18+ where legal
- See full disclaimer on About page

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit for review

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

- Documentation: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Testing: [UAT_CHECKLIST.md](./UAT_CHECKLIST.md)
- Issues: Contact project maintainer

## 🏗️ Built With Lovable

This project was built using [Lovable](https://lovable.dev), the AI-powered full-stack development platform.

**Project URL**: https://lovable.dev/projects/db398982-d3aa-49d4-8cef-29c36af93550

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Status**: Production Ready ✅
