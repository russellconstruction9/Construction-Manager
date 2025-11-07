# Supabase Configuration for Netlify Deployment

## Overview
This app uses Supabase for authentication and data management. To deploy successfully on Netlify, you need to configure redirect URLs in your Supabase project.

## Required Supabase Configuration

### 1. Authentication Redirect URLs

Go to your Supabase Dashboard and configure these redirect URLs:

**Supabase Console > Authentication > URL Configuration**

Add the following URLs in the **Redirect URLs** section:

#### Development (Local Testing)
```
http://localhost:5173/#/auth/callback
http://localhost:3000/#/auth/callback
http://localhost:4173/#/auth/callback
```

#### Production (Netlify)
```
https://YOUR_SITE_NAME.netlify.app/#/auth/callback
```

**Important**: Make sure to:
- Replace `YOUR_SITE_NAME` with your actual Netlify site name
- Include the `#/auth/callback` path exactly as shown
- Add each URL as a separate entry

### 2. Environment Variables on Netlify

Go to your Netlify site settings and configure these environment variables:

**Site Settings > Build & Deploy > Environment**

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get these values from: Supabase Console > Project Settings > API Keys

### 3. Allowed Hosts in Supabase

**Supabase Console > Authentication > Providers**

Ensure your Netlify domain is in the allowed hosts for each provider you want to use.

## How Authentication Works

1. User signs in through the Auth component
2. Supabase redirects to the callback URL: `/#/auth/callback`
3. The app detects the session from URL parameters
4. User is logged in and redirected to the dashboard

## Troubleshooting

### Blank Screen After Login
- Check browser console for errors (F12 > Console tab)
- Verify redirect URL is correctly configured in Supabase
- Check that environment variables are set on Netlify

### "Could not verify JWT" Error
- Verify VITE_SUPABASE_ANON_KEY is correctly set
- Check that the key matches what's in Supabase console

### Authentication Not Working
- Verify redirect URLs match exactly (including hash)
- Check that VITE_SUPABASE_URL is correct
- Ensure CORS is properly configured in Supabase

## Key Files

- `utils/supabase.ts` - Supabase client configuration
- `hooks/useAuth.tsx` - Authentication provider
- `components/Auth.tsx` - Login/signup UI

## Deployment Checklist

- [ ] Supabase project created and URL noted
- [ ] API key (anon key) noted
- [ ] Redirect URLs added to Supabase
- [ ] Environment variables set on Netlify
- [ ] App builds successfully locally
- [ ] App runs on preview server
- [ ] Deploy to Netlify
- [ ] Test authentication flow on live site
