# Construction Manager - Supabase Multi-Tenant SaaS Migration

This document outlines the migration from localStorage to Supabase for the Construction Manager application, now configured as a full multi-tenant SaaS platform.

## 🎯 What's New

Your Construction Manager app has been prepared for Supabase with:

- ✅ **Multi-tenant architecture** - Each construction company is isolated
- ✅ **Row Level Security (RLS)** - Automatic data isolation between organizations
- ✅ **Authentication system** - Email/password with Supabase Auth
- ✅ **Cloud database** - PostgreSQL with automatic backups
- ✅ **File storage** - Supabase Storage for photos and receipts
- ✅ **Real-time capabilities** - Live updates across devices
- ✅ **Role-based permissions** - Admin and Employee roles

## 📁 Files Created

### Configuration Files
- `.env` - Environment variables (add your Supabase credentials)
- `.env.example` - Template for environment variables
- `supabase/config.toml` - Supabase local development config

### Database Migrations
- `supabase/migrations/20231201000001_initial_schema.sql` - Database tables
- `supabase/migrations/20231201000002_rls_policies.sql` - Security policies
- `supabase/migrations/20231201000003_auth_triggers.sql` - Auth automation
- `supabase/migrations/20231201000004_storage_setup.sql` - File storage buckets

### TypeScript/JavaScript Files
- `utils/supabase.ts` - Supabase client configuration
- `utils/database.types.ts` - TypeScript types for database
- `hooks/useAuth.tsx` - Authentication context and hooks
- `hooks/useSupabase.tsx` - Supabase profile/org context

### Documentation
- `SUPABASE_SETUP.md` - Detailed setup instructions
- `MIGRATION_GUIDE.md` - This file

## 🚀 Quick Start

### 1. Install Dependencies

Already done! The Supabase client library has been installed.

### 2. Set Up Supabase Project

Follow the instructions in `SUPABASE_SETUP.md` to:
1. Create a Supabase project
2. Get your API keys
3. Update `.env` file
4. Run database migrations
5. Verify storage buckets

### 3. Wrap Your App with Providers

Update your `App.tsx` or `index.tsx` to include the authentication provider:

```tsx
import { AuthProvider } from './hooks/useAuth';
import { SupabaseProvider } from './hooks/useSupabase';

function App() {
  return (
    <AuthProvider>
      <SupabaseProvider>
        {/* Your existing app */}
      </SupabaseProvider>
    </AuthProvider>
  );
}
```

### 4. Update Components to Use Supabase

Your existing `useDataContext` still uses localStorage. You'll need to gradually migrate to Supabase queries.

## 🔄 Migration Strategy

### Phase 1: Authentication (Recommended First Step)

1. Add login/signup screens
2. Replace the `UserSwitcher` with actual authentication
3. Remove the mock user switching logic

Example login component:
```tsx
import { useAuth } from './hooks/useAuth';

function Login() {
  const { signIn, signUp } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) console.error(error);
  };
  
  // ... render your login form
}
```

### Phase 2: Migrate Data Layer

Replace localStorage operations in `useDataContext.ts` with Supabase queries:

#### Before (localStorage):
```typescript
const [users, setUsers] = useState<User[]>(() => 
  getStoredItem('scc_users', defaultUsers)
);
```

#### After (Supabase):
```typescript
const [users, setUsers] = useState<Profile[]>([]);

useEffect(() => {
  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', profile.organization_id);
    if (data) setUsers(data);
  };
  fetchUsers();
}, [profile]);
```

### Phase 3: Migrate Each Feature

Migrate features one at a time:

#### 3.1 Projects
```typescript
// Create project
const { data, error } = await supabase
  .from('projects')
  .insert({
    organization_id: profile.organization_id,
    name,
    address,
    project_type,
    status,
    start_date,
    end_date,
    budget,
    created_by: user.id,
  })
  .select()
  .single();

// Get projects
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('organization_id', profile.organization_id)
  .order('created_at', { ascending: false });
```

#### 3.2 Tasks
```typescript
// Create task
const { data, error } = await supabase
  .from('tasks')
  .insert({
    organization_id: profile.organization_id,
    project_id,
    title,
    description,
    assignee_id,
    due_date,
    status: 'To Do',
  })
  .select()
  .single();

// Update task status
const { error } = await supabase
  .from('tasks')
  .update({ status: newStatus })
  .eq('id', taskId);
```

#### 3.3 Time Tracking
```typescript
// Clock in
const { data: timeLog } = await supabase
  .from('time_logs')
  .insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    project_id,
    clock_in: new Date().toISOString(),
    clock_in_location: { lat, lng },
  })
  .select()
  .single();

// Clock out
const { error } = await supabase
  .from('time_logs')
  .update({
    clock_out: new Date().toISOString(),
    duration_ms: Date.now() - new Date(clockIn).getTime(),
    cost: (duration_ms / 3600000) * hourlyRate,
  })
  .eq('id', timeLogId);
```

#### 3.4 Photos (Supabase Storage)
```typescript
import { uploadFile, getPublicUrl, STORAGE_BUCKETS } from './utils/supabase';

// Upload photo
const file = base64ToBlob(imageDataUrl, 'image/jpeg');
const path = `${profile.organization_id}/${projectId}/${Date.now()}.jpg`;

await uploadFile(STORAGE_BUCKETS.PROJECT_PHOTOS, path, file);

// Save photo record
await supabase
  .from('project_photos')
  .insert({
    organization_id: profile.organization_id,
    project_id,
    storage_path: path,
    description,
    uploaded_by: user.id,
  });

// Get photo URL
const photoUrl = getPublicUrl(STORAGE_BUCKETS.PROJECT_PHOTOS, path);
```

#### 3.5 Estimates
```typescript
// Create estimate with items
const { data: estimate } = await supabase
  .from('estimates')
  .insert({
    organization_id: profile.organization_id,
    project_id,
    name,
    status: 'Draft',
    total_amount: 0,
    total_estimated_hours: 0,
    created_by: user.id,
  })
  .select()
  .single();

// Add estimate items
const { error } = await supabase
  .from('estimate_items')
  .insert(
    items.map(item => ({
      organization_id: profile.organization_id,
      estimate_id: estimate.id,
      ...item,
    }))
  );
```

### Phase 4: Add Real-time Updates

Enable live updates across all devices:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('projects-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `organization_id=eq.${profile.organization_id}`,
      },
      (payload) => {
        // Update local state when projects change
        console.log('Project changed:', payload);
        refetchProjects();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [profile]);
```

### Phase 5: Clean Up

Once everything is migrated:
1. Remove localStorage code from `useDataContext.ts`
2. Remove IndexedDB code from `utils/db.ts`
3. Remove the `UserSwitcher` component
4. Add proper loading states
5. Add error handling
6. Test thoroughly

## 🔐 Security Considerations

### Row Level Security (RLS)

All data is automatically isolated by organization. The RLS policies ensure:
- Users only see data from their organization
- Admins have extra permissions within their org
- No cross-organization data leaks

### Authentication

- Passwords are hashed by Supabase
- JWTs are used for session management
- Sessions are stored securely in localStorage
- Automatic token refresh

### Storage

- Files are organized by organization ID
- Storage policies prevent cross-org access
- Public bucket for project photos (with access control)
- Private buckets for receipts and maps

## 📊 Database Schema

### Key Tables

1. **organizations** - Each construction company
2. **profiles** - User accounts (extends auth.users)
3. **projects** - Construction projects
4. **tasks** - Project tasks
5. **time_logs** - Time tracking
6. **punch_list_items** - Punch lists
7. **project_photos** - Photo metadata
8. **inventory_items** - Inventory management
9. **estimates** - Job estimates
10. **estimate_items** - Estimate line items
11. **expenses** - Project expenses

All tables include:
- `organization_id` for multi-tenancy
- `created_at` and `updated_at` timestamps
- Proper foreign keys and indexes

## 🧪 Testing

### Test Checklist

- [ ] Create new organization (signup)
- [ ] Login with existing account
- [ ] Create a project
- [ ] Add team members
- [ ] Create tasks
- [ ] Clock in/out
- [ ] Upload photos
- [ ] Create estimates
- [ ] Add expenses
- [ ] Verify data isolation (create second org to test)
- [ ] Test real-time updates
- [ ] Test offline behavior

## 🚨 Common Issues

### Environment Variables Not Loading
- Restart your dev server after changing `.env`
- Vite requires `VITE_` prefix for env vars
- Check for typos in variable names

### RLS Errors
- Make sure user has a profile
- Verify organization_id is set
- Check RLS policies in Supabase dashboard

### Storage Upload Fails
- Verify buckets exist
- Check storage policies
- Ensure correct bucket name
- File size limits (50MB default)

### Types Don't Match
- Regenerate types: `supabase gen types typescript`
- Update `utils/database.types.ts`

## 📈 Next Steps

### Performance Optimization
1. Add database indexes for common queries
2. Implement pagination for large datasets
3. Use Supabase Edge Functions for complex operations
4. Add caching layer for frequently accessed data

### Features to Add
1. Team invitations via email
2. Project templates
3. Reporting dashboard
4. Export data to PDF/Excel
5. Mobile app (React Native)
6. Offline mode with sync
7. Push notifications
8. Audit logs

### Production Deployment
1. Set up staging environment
2. Configure custom domain
3. Set up monitoring (Sentry, etc.)
4. Add analytics
5. Set up automated backups
6. Configure SMTP for emails
7. Add rate limiting
8. Set up CI/CD pipeline

## 💡 Tips

1. **Start small**: Migrate one feature at a time
2. **Test thoroughly**: Create a test organization
3. **Use transactions**: For complex multi-table operations
4. **Handle errors**: Always check for errors in Supabase responses
5. **Use TypeScript**: The generated types help catch bugs
6. **Real-time subscriptions**: Great for collaborative features
7. **Batch operations**: Use `.insert()` with arrays for bulk inserts
8. **Indexes**: Add indexes for columns you frequently query

## 🆘 Support

- **Supabase Docs**: https://supabase.com/docs
- **Discord**: https://discord.supabase.com
- **Stack Overflow**: Tag with `supabase`
- **GitHub**: https://github.com/supabase/supabase

## 📝 License

Your existing license applies to this migrated version.

---

**Ready to get started?** Head over to `SUPABASE_SETUP.md` for step-by-step instructions!
