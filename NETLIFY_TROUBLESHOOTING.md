# Netlify Deployment Checklist & Troubleshooting

## Current Deployment
- **Site**: https://constructionmanager12.netlify.app/
- **Repository**: russellconstruction9/Construction-Manager

## Issues & Fixes

### Issue 1: Blank Screen on Initial Load

**Possible Causes:**
1. JavaScript error preventing app from rendering
2. Missing static assets (CSS, fonts)
3. Supabase environment variables not set
4. AuthProvider hanging on initialization

**Fix Applied:**
- ✅ Added global error handlers in `index.tsx`
- ✅ Added 5-second timeout to Supabase auth initialization
- ✅ Improved error messages to show what went wrong
- ✅ Ensured CSS loads properly with critical base styles
- ✅ Created fallback UI if React fails to initialize

### Issue 2: Environment Variables Not Available

**What's needed on Netlify:**

Go to: **Site Settings > Build & Deploy > Environment variables**

Add these variables:
```
VITE_SUPABASE_URL = https://lppghtrmdpsvpstocneq.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwcGdodHJtZHBzdnBzdG9jbmVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTM1OTAsImV4cCI6MjA3ODAyOTU5MH0.IOJhdFF0dn4Kz4LNL1tF8OT4fInTDb5JOwdUfgzuXn8
VITE_APP_NAME = ConstructTrack Pro
VITE_APP_DESCRIPTION = Professional Construction Management SaaS
VITE_NODE_ENV = production
```

### Issue 3: Supabase Authentication Redirects

**What's needed in Supabase Console:**

Go to: **Supabase Dashboard > Authentication > URL Configuration**

Add these **Redirect URLs**:
```
https://constructionmanager12.netlify.app/#/auth/callback
https://constructionmanager12.netlify.app/#/
http://localhost:5173/#/auth/callback
http://localhost:3000/#/auth/callback
```

## Testing Steps

### 1. Test Build Locally
```bash
npm run build
npm run preview
# Visit http://localhost:4173/
```

**What you should see:**
- Loading spinner for 2-3 seconds
- Auth screen showing "Configuration Required" OR login form (if Supabase configured)
- No blank page or console errors

### 2. Check Browser Console
Go to: https://constructionmanager12.netlify.app/
- Press `F12` to open Developer Tools
- Go to **Console** tab
- Look for messages like:
  - `index.tsx loading...` ✅ Good
  - `Supabase configured: true` ✅ Good
  - `App component rendering...` ✅ Good
  - Red errors ❌ Problem

### 3. Test Debug Modes
Try these URLs to test different aspects:

- `https://constructionmanager12.netlify.app/#/?test=simple`
  - Tests basic React rendering without authentication
  
- `https://constructionmanager12.netlify.app/#/?test=noauth`
  - Tests React + CSS without authentication complexity

- `https://constructionmanager12.netlify.app/#/?test=auth`
  - Tests full authentication flow

## Netlify Build Settings

**Current configuration in `netlify.toml`:**
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Node version: 18

**Verify these match your Netlify site:**

Site Settings > Build & Deploy > Build settings:
- Build command: `npm install && npm run build` (or just `npm run build`)
- Publish directory: `dist`
- Functions directory: (optional) `netlify/functions`

## Common Error Messages & Solutions

### "Supabase environment variables not configured"
**Solution**: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Netlify environment variables

### "Could not verify JWT token"
**Solution**: The VITE_SUPABASE_ANON_KEY is incorrect or doesn't match your Supabase project

### "Redirect URL mismatch"
**Solution**: Make sure the redirect URL in Supabase exactly matches `https://constructionmanager12.netlify.app/#/auth/callback` (including the `#`)

### Blank page with no errors
**Solution**: 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito/private mode
3. Check if JavaScript is enabled in browser
4. Check browser console for errors (F12)

## Files Changed for This Fix

- `index.tsx` - Added global error handling
- `hooks/useAuth.tsx` - Added timeout to auth initialization
- `src/index.css` - Fixed critical CSS for rendering
- `utils/supabase.ts` - Updated auth configuration
- `App.tsx` - Added debug modes and error boundaries
- `components/AuthCallback.tsx` - New component for auth callback handling
- `netlify.toml` - Already configured correctly
- `SUPABASE_CONFIG.md` - Configuration guide

## Next Steps

1. **Verify all environment variables are set on Netlify**
2. **Check Supabase redirect URLs are configured**
3. **Trigger a new deploy on Netlify** (push to main or redeploy manually)
4. **Test the app** at https://constructionmanager12.netlify.app/
5. **Check browser console** for any errors
6. **Test auth flow** if Supabase is configured

## Support

If you still see a blank screen:
1. Open browser console (F12)
2. Check for red error messages
3. Share the error with the description
4. Verify environment variables are actually set (not just in netlify.toml)
