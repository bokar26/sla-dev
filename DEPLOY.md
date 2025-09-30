# Production Deployment Guide

This guide covers deploying the SLA application to production using Heroku (backend) and Vercel (frontend).

## Prerequisites

- Heroku CLI installed and logged in
- Vercel CLI installed and logged in (optional, can use web interface)
- Git repository with all changes committed

## Backend Deployment (Heroku)

### 1. Create Heroku App

```bash
heroku login
heroku create sla-api-prod
heroku stack:set heroku-22 -a sla-api-prod
```

### 2. Set Environment Variables

```bash
heroku config:set -a sla-api-prod \
  NODE_ENV=production \
  CLIENT_ORIGIN=https://<your-vercel-domain> \
  API_ORIGIN=https://sla-api-prod.herokuapp.com \
  JWT_SECRET=<strong-secret> \
  ALLOWED_HOSTS=localhost,127.0.0.1,sla-api-prod.herokuapp.com
```

### 3. Deploy

```bash
git push https://git.heroku.com/sla-api-prod.git HEAD:main
heroku open -a sla-api-prod
heroku logs -t -a sla-api-prod
```

## Frontend Deployment (Vercel)

### 1. Import Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Set **Root Directory** to `apps/web`
5. Configure build settings:
   - **Install Command**: `pnpm install`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`

### 2. Set Environment Variables

In Vercel project settings, add:
- `VITE_API_URL` = `https://sla-api-prod.herokuapp.com`

### 3. Deploy

Click "Deploy" and wait for the build to complete.

## Post-Deployment Verification

### Health Checks

1. **Backend Health**:
   ```bash
   curl https://sla-api-prod.herokuapp.com/healthz
   # Should return: ok
   
   curl https://sla-api-prod.herokuapp.com/readyz
   # Should return: ready
   ```

2. **Frontend**:
   - Visit your Vercel domain
   - Verify the landing page loads
   - Check browser console for any CORS errors

### Functionality Tests

1. **API Integration**:
   - From the Vercel app, try making API calls
   - Verify no CORS errors in browser console
   - Check that real data loads (no mock data)

2. **Mobile Responsiveness**:
   - Test on mobile devices or browser dev tools
   - Verify landing page looks correct on ≤640px screens

3. **Security**:
   - Verify HTTPS is enforced
   - Check security headers are present
   - Confirm no sensitive data in client-side code

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure `CLIENT_ORIGIN` matches your Vercel domain exactly
   - Check that the domain doesn't have trailing slashes

2. **Build Failures**:
   - Check Heroku logs: `heroku logs -t -a sla-api-prod`
   - Verify all dependencies are in `requirements.txt`

3. **Environment Variables**:
   - Double-check all env vars are set correctly
   - Ensure no typos in variable names

### Logs and Monitoring

- **Heroku**: `heroku logs -t -a sla-api-prod`
- **Vercel**: Check deployment logs in Vercel dashboard
- **Browser**: Use DevTools Network tab to debug API calls

## Security Considerations

- All environment variables are properly configured
- CORS is restricted to production domains only
- Security headers are enabled
- HTTPS is enforced on both platforms
- No sensitive data exposed in client-side code

## Rollback Procedure

If issues occur:

1. **Heroku**: `heroku rollback -a sla-api-prod`
2. **Vercel**: Use the "Redeploy" option in Vercel dashboard to deploy a previous version
