# Supabase Setup Guide for Construction Manager

This guide will help you set up Supabase for your multi-tenant SaaS Construction Manager application.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git installed
- Supabase CLI installed (optional but recommended)

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Project Name**: Construction Manager
   - **Database Password**: (choose a strong password and save it)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (or your preferred plan)
5. Click "Create new project"
6. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** > **API**
2. You'll need two values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Anon/Public Key** (a long JWT token)

## Step 3: Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-existing-key
VITE_GEMINI_API_KEY=your-existing-key
```

3. Save the file

## Step 4: Run Database Migrations

You have two options to set up your database:

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of each migration file in order:
   - `supabase/migrations/20231201000001_initial_schema.sql`
   - `supabase/migrations/20231201000002_rls_policies.sql`
   - `supabase/migrations/20231201000003_auth_triggers.sql`
   - `supabase/migrations/20231201000004_storage_setup.sql`
5. Click "Run" for each migration

### Option B: Using Supabase CLI (Recommended for Production)

1. Install Supabase CLI:
   ```powershell
   npm install -g supabase
   ```

2. Login to Supabase:
   ```powershell
   supabase login
   ```

3. Link your project:
   ```powershell
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Settings > General)

4. Push migrations:
   ```powershell
   supabase db push
   ```

## Step 5: Set Up Storage Buckets

The migrations should have created the storage buckets automatically. Verify by:

1. Go to **Storage** in your Supabase dashboard
2. You should see three buckets:
   - `project-photos` (public)
   - `map-images` (private)
   - `receipts` (private)

If they're not there, you can create them manually:
1. Click "New bucket"
2. Create each bucket with the settings in the migration file

## Step 6: Configure Authentication

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email templates (optional):
   - Go to **Authentication** > **Email Templates**
   - Customize the confirmation, password reset, and magic link emails

### Email Configuration (Production)

For production, you'll want to set up a custom SMTP server:

1. Go to **Settings** > **Auth**
2. Scroll to "SMTP Settings"
3. Enable custom SMTP
4. Fill in your SMTP credentials

## Step 7: Test the Setup

1. Start your development server:
   ```powershell
   npm run dev
   ```

2. The app should now connect to Supabase
3. Try creating a new account to test:
   - The auth system should create a new organization
   - A profile should be automatically created
   - You should be logged in

## Multi-Tenant Architecture

Your app is now set up as a multi-tenant SaaS:

### How it Works

1. **Organizations**: Each construction company is an organization
2. **Users (Profiles)**: Each user belongs to one organization
3. **Row Level Security**: Automatically enforces data isolation
   - Users can only see data from their organization
   - Admins have additional permissions within their organization
4. **Authentication**: Handled by Supabase Auth
5. **Storage**: Files are organized by organization ID

### Security Features

✅ **Row Level Security (RLS)**: All tables have RLS policies
✅ **Multi-tenant isolation**: Organizations cannot access each other's data
✅ **Role-based access**: Admin vs Employee permissions
✅ **Secure storage**: Files are scoped to organizations
✅ **JWT-based auth**: Industry-standard authentication

## Next Steps

### 1. Update Your App Code

The current app uses localStorage for data. You'll need to update the `useDataContext` hook to use Supabase queries instead. Key changes needed:

- Replace localStorage with Supabase queries
- Use real-time subscriptions for live updates
- Update photo storage to use Supabase Storage
- Add proper error handling

### 2. Add Real-time Features

Supabase supports real-time subscriptions:

```typescript
// Example: Subscribe to project updates
supabase
  .channel('projects')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'projects' },
    (payload) => {
      console.log('Project changed:', payload)
    }
  )
  .subscribe()
```

### 3. Set Up Local Development (Optional)

For offline development:

```powershell
supabase start
```

This starts a local Supabase instance with Docker.

### 4. Deploy

When ready to deploy:

1. Set environment variables in your hosting platform
2. Ensure your production domain is added to Auth > URL Configuration
3. Test thoroughly before going live

## Troubleshooting

### "Invalid API key" Error
- Double-check your `.env` file
- Make sure you're using the `ANON` key, not the `SERVICE_ROLE` key
- Restart your dev server after changing `.env`

### "Row Level Security" Errors
- Make sure all RLS policies were applied
- Check that your user has a profile with an organization_id
- Use Supabase SQL Editor to debug queries

### Storage Upload Fails
- Verify storage buckets exist
- Check storage policies were applied
- Ensure you're using the correct bucket name

### Authentication Issues
- Check Auth settings in Supabase dashboard
- Verify email provider is enabled
- Check browser console for detailed errors

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: For app-specific issues

## Data Migration from LocalStorage

To migrate existing localStorage data to Supabase:

1. Create a migration script (we can provide this)
2. Export data from localStorage
3. Transform to match new schema
4. Import via Supabase client
5. Test thoroughly
6. Remove localStorage code

Contact your development team for assistance with data migration.
