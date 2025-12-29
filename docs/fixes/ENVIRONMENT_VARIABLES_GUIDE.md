# Environment Variables Guide

**Standardization completed**: January 2025
**Supabase key format**: New (sb_publishable_ / sb_secret_)

---

## 📋 Quick Reference

### Required Variables

```env
# AI Service
GEMINI_API_KEY=AIzaSy...

# Supabase - Server-side (NEVER expose to client)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...

# Supabase - Client-side (Safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Optional: Vercel KV (Auto-populated when KV database created)
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

---

## 🔑 Variable Details

### GEMINI_API_KEY
- **Required**: Yes
- **Exposed to client**: No
- **Format**: `AIzaSy...` (39 characters)
- **Where to get**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Used in**: `src/domains/intelligence/actions.ts`
- **Security**: Server-side only, NEVER use `NEXT_PUBLIC_` prefix

**Example**:
```env
GEMINI_API_KEY=AIzaSyDAzmV1dclvgqnz5Y-O9Jiw2CEyJPa5paI
```

---

### SUPABASE_URL
- **Required**: Yes
- **Exposed to client**: No (use `NEXT_PUBLIC_SUPABASE_URL` instead)
- **Format**: `https://PROJECT_ID.supabase.co`
- **Where to get**: Supabase Dashboard → Project Settings → API
- **Used in**: Server-side Supabase clients

**Example**:
```env
SUPABASE_URL=https://cwdedqlwjgitpcpxyduj.supabase.co
```

---

### SUPABASE_SECRET_KEY
- **Required**: Yes
- **Exposed to client**: No
- **Format**: `sb_secret_...` (new format) OR JWT string (legacy `service_role`)
- **Where to get**: Supabase Dashboard → Project Settings → API → Secret Key
- **Used in**: Admin operations, bypassing RLS
- **Security**: 🔴 HIGH RISK - Full database access, NEVER commit to Git

**New format (recommended)**:
```env
SUPABASE_SECRET_KEY=sb_secret_WYeW-sp-Daiv1xBDP-zFhQ_OWSYV5YL
```

**Legacy format (still supported)**:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### NEXT_PUBLIC_SUPABASE_URL
- **Required**: Yes
- **Exposed to client**: Yes (safe)
- **Format**: `https://PROJECT_ID.supabase.co`
- **Where to get**: Same as `SUPABASE_URL`
- **Used in**: Client-side Supabase clients
- **Note**: Must match `SUPABASE_URL`

**Example**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://cwdedqlwjgitpcpxyduj.supabase.co
```

---

### NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- **Required**: Yes
- **Exposed to client**: Yes (safe by design)
- **Format**: `sb_publishable_...` (new format) OR JWT string (legacy `anon`)
- **Where to get**: Supabase Dashboard → Project Settings → API → Publishable Key
- **Used in**: All client-side database operations
- **Security**: ✅ Safe to expose, respects RLS policies

**New format (recommended)**:
```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_UP1Dkpnaq-_-c5Q5Sq8omA_Wr95HwU9
```

**Legacy format (still supported)**:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### KV_REST_API_URL (Optional)
- **Required**: No (only if using Vercel KV for rate limiting)
- **Exposed to client**: No
- **Format**: `https://REGION-DATABASE_NAME.kv.vercel-storage.com`
- **Where to get**: Auto-populated when creating KV database in Vercel
- **Used in**: `src/utils/rateLimit.vercel.ts`

**Example**:
```env
KV_REST_API_URL=https://brief-mouse-12345.kv.vercel-storage.com
```

---

### KV_REST_API_TOKEN (Optional)
- **Required**: No (only if using Vercel KV)
- **Exposed to client**: No
- **Format**: Base64 string starting with `A...`
- **Where to get**: Auto-populated when creating KV database in Vercel
- **Used in**: `src/utils/rateLimit.vercel.ts`
- **Security**: 🟠 MEDIUM RISK - Database access token

**Example**:
```env
KV_REST_API_TOKEN=AbCdEf1234567890...
```

---

## 🔄 Migration from Legacy Keys

### Why Migrate?

Supabase introduced new key formats in 2024 for better security:
- **New keys** can be rotated without changing JWT secrets
- **New keys** have clearer naming (`publishable` vs `anon`)
- **Legacy keys** still work but will be deprecated

### Migration Steps

1. **Get new keys** from Supabase Dashboard → Project Settings → API
2. **Update `.env` files**:
   ```diff
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

   - SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   + SUPABASE_SECRET_KEY=sb_secret_...
   ```

3. **Update code** (find & replace):
   ```bash
   # Find all usages
   grep -r "SUPABASE_ANON_KEY" src/
   grep -r "SUPABASE_SERVICE_ROLE" src/

   # Replace in each file
   SUPABASE_ANON_KEY → NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   SUPABASE_SERVICE_ROLE_KEY → SUPABASE_SECRET_KEY
   ```

4. **Test locally**:
   ```bash
   npm run dev
   # Try login, signup, AI features
   ```

5. **Deploy**:
   ```bash
   # Update Vercel environment variables
   vercel env pull
   # Edit .env.local with new keys
   vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
   vercel env add SUPABASE_SECRET_KEY production

   # Deploy
   vercel --prod
   ```

---

## 🛡️ Security Best Practices

### DO ✅
- Use `.env.local` for local development (Git-ignored)
- Use Vercel Dashboard for production secrets
- Use `NEXT_PUBLIC_` prefix ONLY for safe-to-expose values
- Rotate keys every 90 days (especially `SUPABASE_SECRET_KEY`)
- Use new key format (`sb_publishable_` / `sb_secret_`)

### DON'T ❌
- Commit `.env.prod` to Git
- Use `NEXT_PUBLIC_` prefix for API keys or secret keys
- Share secret keys via Slack/email
- Use production keys in development
- Hard-code any secrets in source code

---

## 🔍 Verification

### Check Current Keys
```bash
# In project root
cat .env.local | grep "SUPABASE"
```

### Verify Format
```bash
# Should see new format
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# If you see this, migrate:
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Test Keys
```typescript
// Create test script: scripts/test-env.ts
async function testKeys() {
  const { createClient } = await import('@supabase/supabase-js');

  // Test publishable key
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data, error } = await client.from('users').select('count');
  console.log('Publishable key works:', !error);

  // Test secret key
  const adminClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: adminData, error: adminError } = await adminClient
    .from('users')
    .select('count');
  console.log('Secret key works:', !adminError);
}

testKeys();
```

Run:
```bash
npx tsx scripts/test-env.ts
```

---

## 📁 File Structure

```
rtios-next/
├── .env.local           # Local development (Git-ignored)
├── .env.example         # Template with placeholders (Git-tracked)
├── .env.prod            # Production backup (Git-ignored)
└── .gitignore           # Ensures .env* files aren't committed
```

### .env.local
```env
# Active local development environment
# Copy from .env.example and fill in real values
GEMINI_API_KEY=AIzaSy...
SUPABASE_URL=https://...
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### .env.example
```env
# Template for new developers
# Replace all values with your own
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_secret_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

---

## 🌍 Environment-Specific Values

### Development
```env
# Use test/staging Supabase project
SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co

# Lower rate limits for testing
RATE_LIMIT_AI_REQUESTS=10
```

### Production
```env
# Use production Supabase project
SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co

# Production rate limits
RATE_LIMIT_AI_REQUESTS=3
```

---

## 🚨 Troubleshooting

### "Invalid API key" error
```bash
# Check key format
echo $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
# Should start with: sb_publishable_

# If starts with "eyJ", you're using legacy format - update to new format
```

### "Unauthorized" on admin actions
```bash
# Check secret key is set
echo $SUPABASE_SECRET_KEY | cut -c1-15
# Should output: sb_secret_...

# Verify in code:
grep -r "SUPABASE_SECRET_KEY" src/utils/supabase/server.ts
```

### Variables not loading in Vercel
```bash
# Pull latest from Vercel
vercel env pull .env.vercel.local

# Check what's in Vercel
vercel env ls

# Re-add if missing
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
```

### Build fails with "undefined"
```typescript
// Add runtime checks in next.config.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'GEMINI_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required env var: ${envVar}`);
  }
}
```

---

## 📞 Support

- **Supabase Keys**: https://supabase.com/docs/guides/api/api-keys
- **Next.js Env Vars**: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- **Vercel Env Vars**: https://vercel.com/docs/projects/environment-variables

---

**Last Updated**: January 2025
**Maintained By**: Development Team
**Review Frequency**: Quarterly or after Supabase updates
