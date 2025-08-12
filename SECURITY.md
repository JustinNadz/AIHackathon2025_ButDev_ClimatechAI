# 🔒 ClimaTech AI Security Guidelines

## API Key Management

**⚠️ CRITICAL: NEVER hardcode API keys in source files!**

### ✅ Correct API Key Storage

All API keys must be stored in `.env` files and accessed via environment variables:

#### Frontend-Admin (.env.local)
```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=ClimaTech AI Frontend-Admin

# Backend Integration
BACKEND_URL=http://localhost:5000
ASSISTANT_AUTO_INGEST=true

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/climatech-ai
MONGODB_CONNECTION=mongodb://localhost:27017
MONGODB_DATABASE=climatech-ai

# JWT Configuration  
JWT_SECRET=your_jwt_secret_key_change_in_production

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

#### Backend (.env)
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/climatech

# API Keys - REPLACE WITH YOUR ACTUAL KEYS
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Vector Database
CHROMA_DB_DIR=./chroma_store

# Backend URL for Frontend-Admin
BACKEND_URL=http://localhost:5000

# Auto-ingest mode for assistant learning
ASSISTANT_AUTO_INGEST=true
```

### 🔒 Environment Variable Usage

#### Frontend (Next.js)
```typescript
// ✅ CORRECT: Access via process.env
const apiKey = process.env.OPENROUTER_API_KEY

// ✅ CORRECT: Check if key exists
if (!apiKey) {
  return Response.json({
    reply: "OpenRouter key not configured. Add OPENROUTER_API_KEY in .env.local"
  })
}
```

#### Backend (Python)
```python
# ✅ CORRECT: Use config.py for centralized env loading
from config import OPENROUTER_API_KEY

# config.py content:
import os
from dotenv import load_dotenv

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
```

### ❌ What NOT to Do

```typescript
// ❌ NEVER hardcode API keys
const apiKey = "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"

// ❌ NEVER commit .env files with real keys
// Add .env and .env.local to .gitignore

// ❌ NEVER log API keys
console.log("API Key:", process.env.OPENROUTER_API_KEY)
```

## Security Checklist

- [ ] All API keys are in `.env` files only
- [ ] No hardcoded credentials in source code
- [ ] `.env` files are in `.gitignore`
- [ ] Environment variables are validated before use
- [ ] Error messages don't expose sensitive information
- [ ] API keys are not logged or exposed in client-side code

## Getting Your API Keys

### OpenRouter API Key
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Create an account and get your API key
3. Replace `your_openrouter_api_key_here` in your `.env` files

### Google Maps API Key
1. Visit [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a project and enable Maps JavaScript API
3. Create credentials (API Key)
4. Replace `your_google_maps_api_key_here` in `.env.local`

## File Security Status

✅ **Secure Files:**
- `Frontend-Admin/app/api/assistant/chat/route.ts` - Uses env vars
- `backend/config.py` - Centralized env loading
- `backend/ai/llm.py` - Uses config imports
- `backend/vectordb/store.py` - Uses config imports

✅ **Environment Files:**
- `Frontend-Admin/.env.local` - Template with placeholders
- `backend/.env` - Template with placeholders
- `backend/.env_example` - Example configuration

## Deployment Notes

1. **Production**: Use secure secret management (AWS Secrets Manager, Azure Key Vault, etc.)
2. **Environment Separation**: Different keys for dev/staging/production
3. **Key Rotation**: Regularly rotate API keys
4. **Access Control**: Limit who can access production environment variables

---

**Remember: Security is everyone's responsibility! 🛡️**
