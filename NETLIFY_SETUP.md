# Netlify Environment Variables Setup

Configure these environment variables in your Netlify dashboard:
**Site Settings > Environment Variables**

## Required Variables

```bash
VITE_SUPABASE_URL=https://lppghtrmdpsvpstocneq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwcGdodHJtZHBzdnBzdG9jbmVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTM1OTAsImV4cCI6MjA3ODAyOTU5MH0.IOJhdFF0dn4Kz4LNL1tF8OT4fInTDb5JOwdUfgzuXn8
VITE_NODE_ENV=production
VITE_APP_NAME=ConstructTrack Pro  
VITE_APP_DESCRIPTION=Professional Construction Management SaaS
VITE_API_BASE_URL=/api
```

## Optional Variables (for full functionality)

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Notes

- Supabase anon key is public and safe to expose in frontend
- The app will work without optional API keys but with limited features
- API keys should be obtained from Google Cloud Console