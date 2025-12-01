# Netlify Deployment Guide

## Quick Deploy

### Option 1: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

### Option 2: Deploy via GitHub (Recommended)

1. **Push code to GitHub** (already done ✅)

2. **Go to Netlify Dashboard:**
   - Visit https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"

3. **Connect Repository:**
   - Select `russellconstruction9/Construction-Manager`
   - Netlify will auto-detect the build settings from `netlify.toml`

4. **Add Environment Variables:**
   Go to Site settings → Environment variables and add:
   ```
   VITE_SUPABASE_URL=https://cwwpvovbxosmkekeefst.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyAyS8VmIL-AbFnpm_xmuKZ-XG8AmSA03AM
   VITE_GEMINI_API_KEY=AIzaSyAdaBG_OpKtJD6sJ4Kup_8gqfvaWPESCl4
   ```

5. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete (~2-3 minutes)

## What's Configured

### Build Settings (`netlify.toml`)
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist`
- ✅ Node version: 20
- ✅ SPA routing with redirects
- ✅ Security headers (XSS protection, frame options)
- ✅ Service Worker caching
- ✅ Asset optimization headers

### Environment Variables Required
All `VITE_*` variables from `.env` must be added to Netlify's environment settings.

### Supabase Configuration
After deployment, add your Netlify URL to Supabase:
1. Go to https://supabase.com/dashboard/project/cwwpvovbxosmkekeefst
2. Navigate to Authentication → URL Configuration
3. Add your Netlify URL to:
   - Site URL: `https://your-site-name.netlify.app`
   - Redirect URLs: `https://your-site-name.netlify.app/**`

## Post-Deployment Checklist

- [ ] Verify all environment variables are set in Netlify
- [ ] Add Netlify URL to Supabase redirect URLs
- [ ] Test authentication flow on production
- [ ] Verify Supabase connection works
- [ ] Test file uploads to Supabase Storage
- [ ] Check service worker registration
- [ ] Test offline functionality

## Continuous Deployment

Once connected to GitHub, Netlify will automatically:
- Deploy on every push to `main` branch
- Build preview deployments for pull requests
- Run build checks before deployment

## Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Add custom domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs with custom domain

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Verify all dependencies in `package.json`
- Ensure TypeScript compiles locally first

### Environment Variables Not Working
- Variables must start with `VITE_` to be exposed to the app
- Redeploy after adding/changing variables
- Clear cache and redeploy if needed

### 404 Errors on Refresh
- Already configured with SPA redirect in `netlify.toml`
- Should redirect all routes to `index.html`

### Supabase Connection Issues
- Verify environment variables are set correctly
- Check browser console for CORS errors
- Ensure Netlify URL is in Supabase redirect URLs

## Performance Optimization

The `netlify.toml` includes:
- Asset caching (1 year for JS/CSS/fonts)
- Security headers
- Service worker support
- Gzip compression (automatic)

## Support

- Netlify Docs: https://docs.netlify.com
- Supabase Docs: https://supabase.com/docs
- GitHub Repo: https://github.com/russellconstruction9/Construction-Manager
