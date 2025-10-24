# NFL Analytics Pro - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration
- ✅ All Supabase secrets configured (OPENAI_API_KEY, ODDS_API_KEY)
- ✅ Database migrations applied successfully
- ✅ RLS policies reviewed and tested
- ✅ Edge functions deployed and tested

### 2. Security Review
- ✅ All RLS policies are in place and correct
- ✅ Input validation implemented on all forms
- ✅ Rate limiting configured for public endpoints
- ✅ CORS headers properly configured
- ✅ Security headers implemented (X-Frame-Options, etc.)
- ✅ API keys stored as secrets (not in code)
- ✅ User roles properly configured

### 3. Performance Optimization
- ✅ Images optimized and lazy-loaded
- ✅ Database queries optimized with proper indexes
- ✅ Edge functions implement caching where appropriate
- ✅ Web Vitals tracked and optimized

### 4. Legal & Compliance
- ✅ Terms of Service page implemented
- ✅ Privacy Policy page implemented
- ✅ Cookie consent banner added
- ✅ GDPR data export functionality
- ✅ Account deletion functionality
- ✅ Disclaimers prominently displayed

### 5. Monitoring & Observability
- ✅ Health check endpoint configured
- ✅ Alert monitoring system active
- ✅ Audit logging implemented
- ✅ Error boundary for React errors
- ✅ Console error logging reviewed

## Deployment Steps

### Step 1: Final Testing
1. Test all user flows (signup, login, viewing predictions, saving selections)
2. Test admin panel functionality
3. Verify edge functions are working:
   - Test data ingestion manually
   - Verify predictions are generated
   - Check narrative generation
   - Test PDF/TTS generation
4. Test on multiple devices and browsers
5. Verify mobile responsiveness

### Step 2: Database Verification
```sql
-- Check all tables have RLS enabled
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT IN (
  SELECT tablename 
  FROM pg_policies 
  WHERE schemaname = 'public'
);

-- Verify admin user exists
SELECT * FROM user_roles WHERE role = 'admin';
```

### Step 3: Deploy Edge Functions
All edge functions are automatically deployed with Lovable Cloud. Verify deployment:
1. Go to Lovable Cloud dashboard
2. Check Edge Functions section
3. Verify all functions are "Active"
4. Test health check: `https://[your-project-url]/functions/v1/health-check`

### Step 4: Configure Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records at your registrar:
   - A Record for root: 185.158.133.1
   - A Record for www: 185.158.133.1
4. Wait for DNS propagation (up to 48 hours)
5. SSL certificate auto-provisioned by Lovable

### Step 5: Set Up Cron Jobs (Optional)
If you want automated daily updates:
```sql
-- Run orchestrator daily at 6 AM ET
SELECT cron.schedule(
  'daily-update',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://[your-project-url]/functions/v1/orchestrator',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- Run alert monitor every 4 hours
SELECT cron.schedule(
  'alert-monitor',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url:='https://[your-project-url]/functions/v1/alert-monitor',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

### Step 6: Initial Data Load
After deployment, trigger the orchestrator to load initial data:
```bash
curl -X POST https://[your-project-url]/functions/v1/orchestrator \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json"
```

### Step 7: Verify Production
1. Visit your deployed site
2. Sign up for a test account
3. Verify all pages load correctly
4. Check health endpoint: `/functions/v1/health-check`
5. Monitor console for errors
6. Test responsive design on mobile

## Post-Deployment

### Monitoring
- Check health endpoint regularly
- Review audit logs in the database
- Monitor edge function logs
- Track performance metrics in Dashboard

### Maintenance Tasks
- **Daily**: Check alert monitor for issues
- **Weekly**: Review model performance metrics
- **Monthly**: Audit security logs
- **As needed**: Update data sources in admin panel

### User Management
To create an admin user:
```sql
-- After a user signs up, promote them to admin
INSERT INTO user_roles (user_id, role)
VALUES ('[user-id]', 'admin');
```

### Backup & Recovery
- Database backups are automatic with Lovable Cloud
- To restore: Use Lovable Cloud dashboard → Database → Restore

## Troubleshooting

### Edge Functions Not Working
1. Check function logs in Lovable Cloud dashboard
2. Verify all secrets are configured
3. Test health check endpoint
4. Review CORS headers configuration

### Database Issues
1. Check RLS policies are not blocking access
2. Verify user_roles table has entries
3. Review audit_logs for security issues
4. Use `has_role` function for admin checks

### Performance Issues
1. Review slow query logs
2. Check database indexes
3. Monitor edge function execution times
4. Optimize large data fetches with pagination

## Support
- Documentation: https://docs.lovable.dev
- Community: https://discord.gg/lovable
- Email: support@lovable.dev

## Production URLs
- Main App: https://[your-domain].lovable.app
- Health Check: https://[your-domain].lovable.app/functions/v1/health-check
- Admin Panel: https://[your-domain].lovable.app/admin
- Dashboard: https://[your-domain].lovable.app/dashboard

---

**Important Disclaimers:**
- This application provides informational analysis only
- NOT gambling or betting advice
- Users must be 18+ where legal
- All predictions are for entertainment purposes
