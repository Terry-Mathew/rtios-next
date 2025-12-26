# Secrets Rotation Runbook

This document provides step-by-step procedures for rotating sensitive API keys and credentials used by the RTIOS application.

---

## 🔴 EMERGENCY: Gemini API Key Leaked

**Symptoms**: API key exposed in public repository, logs, or client-side code.

### Immediate Actions (Do Within 5 Minutes)

1. **Revoke the Compromised Key**
   - Go to https://aistudio.google.com/apikey
   - Find the exposed key
   - Click "Delete" or "Revoke"
   - **Do not skip this step** - revoked keys cannot be used even if someone has the value

2. **Generate New Key**
   - In the same Google AI Studio page
   - Click "Create API Key"
   - Copy the new key immediately (it's only shown once)
   - Store it securely in your password manager

3. **Update Vercel Environment Variables**
   ```bash
   # Remove old key
   vercel env rm GEMINI_API_KEY production
   vercel env rm GEMINI_API_KEY preview

   # Add new key (you'll be prompted to paste the value)
   vercel env add GEMINI_API_KEY production
   # Paste the new key when prompted

   vercel env add GEMINI_API_KEY preview
   # Paste the new key when prompted
   ```

4. **Update Local Development**
   ```bash
   # Edit .env.local
   nano .env.local  # or your preferred editor

   # Update the line:
   GEMINI_API_KEY=your_new_key_here
   ```

5. **Redeploy Application**
   ```bash
   vercel --prod
   ```

6. **Verify Functionality**
   - Test cover letter generation
   - Test company research
   - Test resume parsing
   - Check Vercel logs for any API errors

### Post-Incident Actions (Within 24 Hours)

- [ ] Review git history to ensure key is not committed anywhere
- [ ] Check CI/CD logs for key exposure
- [ ] Update .gitignore to prevent future commits
- [ ] Document how the leak occurred
- [ ] Update team security training if needed

---

## 🔴 EMERGENCY: Supabase Service Role Key Leaked

**Symptoms**: Service role key exposed (bypasses all RLS policies).

### Immediate Actions (Do Within 5 Minutes)

1. **Reset the Service Role Key**
   - Go to Supabase Dashboard: https://supabase.com/dashboard
   - Select your project
   - Go to Settings → API
   - Under "Service Role Key" section, click "Reset"
   - **Important**: This will invalidate the old key immediately
   - Copy the new key (shown only once)

2. **Update Vercel Environment Variables**
   ```bash
   vercel env rm SUPABASE_SERVICE_ROLE_KEY production
   vercel env rm SUPABASE_SERVICE_ROLE_KEY preview

   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   # Paste the new service role key

   vercel env add SUPABASE_SERVICE_ROLE_KEY preview
   # Paste the new service role key
   ```

3. **Update Local Development**
   ```bash
   # Edit .env.local
   nano .env.local

   # Update:
   SUPABASE_SERVICE_ROLE_KEY=your_new_key_here
   ```

4. **Redeploy Application**
   ```bash
   vercel --prod
   ```

5. **Verify Admin Functions**
   - Test admin user deletion
   - Test admin user impersonation
   - Test admin usage reset
   - Check admin dashboard loads correctly

### Post-Incident Actions (Within 24 Hours)

- [ ] Review audit logs for suspicious admin activity
- [ ] Check users table for unauthorized changes
- [ ] Verify no malicious data was inserted
- [ ] Review RLS policies are still intact
- [ ] Document incident in security log

---

## 🟡 PLANNED: Regular Key Rotation (Every 90 Days)

**When**: Perform during low-traffic hours (3-4 AM UTC recommended)

### Pre-Rotation Checklist

- [ ] Announce brief downtime window to beta users
- [ ] Have team member on standby for verification
- [ ] Backup current environment variables
- [ ] Test new keys in preview environment first

### Rotation Procedure

1. **Generate New Keys**
   - Gemini: https://aistudio.google.com/apikey
   - Supabase: Supabase Dashboard → Settings → API

2. **Update Preview Environment First**
   ```bash
   vercel env rm GEMINI_API_KEY preview
   vercel env add GEMINI_API_KEY preview
   # Paste new key

   vercel env rm SUPABASE_SERVICE_ROLE_KEY preview
   vercel env add SUPABASE_SERVICE_ROLE_KEY preview
   # Paste new key
   ```

3. **Test Preview Deployment**
   ```bash
   vercel --env=preview
   # Visit preview URL and test all AI features
   ```

4. **If Tests Pass, Update Production**
   ```bash
   vercel env rm GEMINI_API_KEY production
   vercel env add GEMINI_API_KEY production

   vercel env rm SUPABASE_SERVICE_ROLE_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production

   vercel --prod
   ```

5. **Verify Production**
   - Monitor Vercel logs for 15 minutes
   - Test critical user flows
   - Check error rates in dashboard

6. **Revoke Old Keys**
   - **Wait 24 hours** before revoking old keys (in case rollback needed)
   - Then revoke old Gemini key
   - Then reset old Supabase service role key

---

## 🔵 ADDITIONAL SECRETS

### Supabase Anon Key (Public - Low Risk)

**Note**: This key is designed to be public and protected by RLS policies.

**If compromised**: No immediate action needed, but consider:
- Review RLS policies are correct
- Monitor for unusual API usage
- Rotate if abuse detected

### Database URL (Medium Risk)

If PostgreSQL connection string is exposed:

1. **Immediate**: Change database password in Supabase Dashboard
2. **Update Vercel**: Update `DATABASE_URL` if you use direct Postgres connections
3. **Redeploy**: `vercel --prod`

---

## 📋 Rotation Checklist Template

Use this for each rotation:

```markdown
## Rotation Date: [DATE]

- [ ] Generate new Gemini API key
- [ ] Generate new Supabase service role key
- [ ] Update preview environment
- [ ] Test preview deployment
- [ ] Update production environment
- [ ] Deploy production
- [ ] Monitor for 24 hours
- [ ] Revoke old keys
- [ ] Update runbook if process changed

**Performed by**: [NAME]
**Issues encountered**: [NONE / DESCRIBE]
**Downtime**: [DURATION]
```

---

## 🆘 Rollback Procedure

If new keys cause issues:

1. **Immediate Rollback**
   ```bash
   # Use Vercel dashboard to revert to previous deployment
   # OR manually restore old keys:

   vercel env rm GEMINI_API_KEY production
   vercel env add GEMINI_API_KEY production
   # Paste OLD key (you backed it up, right?)

   vercel --prod
   ```

2. **Un-revoke Old Keys**
   - Gemini: Cannot un-revoke - create another new key
   - Supabase: Cannot un-reset - use backup if available

3. **Debug Issue**
   - Check Vercel logs
   - Verify key format (no extra spaces/newlines)
   - Test key independently (curl to Gemini API)
   - Verify environment variable names match code

---

## 🔐 Best Practices

1. **Never Commit Secrets**
   - Always use `.env.local` for local development
   - Verify `.env.local` is in `.gitignore`
   - Use `git log -p` to check history for leaks

2. **Use Environment Variables**
   - All secrets in Vercel Environment Variables
   - Never hardcode in code
   - Use different keys for preview/production

3. **Limit Access**
   - Only admins have Vercel access
   - Only admins have Supabase admin access
   - Use team member's Google accounts for Gemini keys (not shared account)

4. **Monitor Usage**
   - Check Gemini quota dashboard weekly
   - Monitor Supabase API usage
   - Set up alerts for unusual activity

5. **Document Everything**
   - Update this runbook after each rotation
   - Log all secret rotations
   - Keep audit trail of who rotated what when

---

## 📞 Emergency Contacts

**If you encounter issues during rotation:**

- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/dashboard/support
- Google AI Support: https://ai.google.dev/support

**Team Contacts:**
- Primary: [ADD YOUR NAME]
- Secondary: [ADD BACKUP CONTACT]
- Emergency: [ADD EMERGENCY CONTACT]

---

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/environment-variables)
- [Supabase API Keys Guide](https://supabase.com/docs/guides/api)
- [Google AI Studio](https://aistudio.google.com)
- [RTIOS Security Audit](../SECURITY_AUDIT_REPORT.md)
