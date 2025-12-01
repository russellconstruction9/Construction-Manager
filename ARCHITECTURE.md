# Multi-Tenant SaaS Architecture for Construction Manager

## Overview

Your Construction Manager application is now structured as a full multi-tenant SaaS platform using Supabase. This document explains the architecture, how it works, and best practices.

## What is Multi-Tenancy?

Multi-tenancy means a single application instance serves multiple customers (tenants), with complete data isolation between them. In your case:

- **Tenant** = Construction Company (Organization)
- **Users** = Employees/Admins of that company
- **Data** = Projects, tasks, time logs, etc. for that company

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │   Database   │  │   Storage    │      │
│  │              │  │              │  │              │      │
│  │  - Email     │  │  - PostgreSQL│  │  - Photos    │      │
│  │  - Password  │  │  - RLS       │  │  - Receipts  │      │
│  │  - JWT       │  │  - Triggers  │  │  - Maps      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │ API Calls
                              │
┌─────────────────────────────────────────────────────────────┐
│              Construction Manager React App                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Organization A          Organization B          Org C       │
│  ┌──────────────┐       ┌──────────────┐       ┌────────┐  │
│  │ • Projects   │       │ • Projects   │       │ • Proj │  │
│  │ • Users      │       │ • Users      │       │ • User │  │
│  │ • Tasks      │       │ • Tasks      │       │ • Task │  │
│  │ • Time Logs  │       │ • Time Logs  │       │ • Time │  │
│  └──────────────┘       └──────────────┘       └────────┘  │
│        ↑                        ↑                     ↑      │
│        └────────────────────────┴─────────────────────┘     │
│                    Row Level Security                        │
│              (Automatic Data Isolation)                      │
└─────────────────────────────────────────────────────────────┘
```

## Data Isolation Strategy

### 1. Organization ID on Every Table

Every table includes an `organization_id` column:

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    -- other columns...
);
```

### 2. Row Level Security (RLS)

RLS automatically filters queries based on the authenticated user:

```sql
-- Users can only see projects from their organization
CREATE POLICY "Users can view projects in own organization"
    ON projects FOR SELECT
    USING (organization_id = get_user_organization_id());
```

When you query:
```typescript
const { data } = await supabase.from('projects').select('*');
```

Supabase automatically adds:
```sql
WHERE organization_id = 'user-org-id'
```

### 3. Helper Functions

```sql
-- Get current user's organization
CREATE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is admin
CREATE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
    SELECT role_type = 'Admin' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;
```

## User Journey

### Signup Flow

1. User fills signup form with:
   - Email
   - Password
   - Full Name
   - Organization Name (optional)

2. `signUp()` function called:
```typescript
await signUp(email, password, fullName, organizationName);
```

3. Supabase Auth creates user in `auth.users`

4. Database trigger fires (`handle_new_user()`):
   - Creates new organization
   - Generates unique slug
   - Creates admin profile for user
   - Links user to organization

5. User is logged in automatically

### Login Flow

1. User enters email/password
2. `signIn()` function called
3. Supabase validates credentials
4. JWT token returned and stored
5. Profile and organization fetched
6. User has access to their org's data

### Team Member Flow

Admin can invite team members:

1. Admin creates profile for new user:
```typescript
await supabase.from('profiles').insert({
  organization_id: admin.organization_id,
  email: newUserEmail,
  full_name: name,
  role_type: 'Employee',
  // other fields...
});
```

2. Send invitation email (manual or via edge function)

3. New user signs up with that email

4. System associates them with existing profile

## Permission Model

### Two Role Types

1. **Admin**
   - Full access to organization data
   - Can create/edit/delete projects
   - Can manage team members
   - Can view all time logs
   - Can manage estimates and expenses

2. **Employee**
   - View organization data
   - Create tasks
   - Update own tasks
   - Clock in/out (own time logs)
   - Upload photos
   - View estimates (read-only)

### RLS Policy Examples

#### Admin-Only Access
```sql
CREATE POLICY "Admins can delete projects"
    ON projects FOR DELETE
    USING (
        organization_id = get_user_organization_id() 
        AND is_user_admin()
    );
```

#### User Can Update Own Data
```sql
CREATE POLICY "Users can update own time logs"
    ON time_logs FOR UPDATE
    USING (
        organization_id = get_user_organization_id() 
        AND user_id = auth.uid()
    );
```

## Storage Architecture

### Bucket Structure

```
project-photos/ (public)
├── {org-id-1}/
│   ├── {project-id-1}/
│   │   ├── photo-1.jpg
│   │   └── photo-2.jpg
│   └── {project-id-2}/
│       └── photo-1.jpg
└── {org-id-2}/
    └── {project-id-1}/
        └── photo-1.jpg

map-images/ (private)
├── {org-id}/
│   └── {timestamp}.png

receipts/ (private)
├── {org-id}/
│   └── {expense-id}.pdf
```

### Storage Policies

```sql
-- Users can upload to their org folder only
CREATE POLICY "Users can upload project photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'project-photos' 
    AND (storage.foldername(name))[1] = user_org_id::text
);
```

## Best Practices

### 1. Always Include organization_id

When creating records:
```typescript
await supabase.from('tasks').insert({
  organization_id: profile.organization_id, // ✅ Required!
  project_id,
  title,
  // other fields...
});
```

### 2. Use Transactions for Complex Operations

```typescript
const { data, error } = await supabase.rpc('create_estimate_with_items', {
  p_organization_id: profile.organization_id,
  p_project_id: projectId,
  p_estimate: estimateData,
  p_items: itemsArray,
});
```

### 3. Handle Errors Gracefully

```typescript
const { data, error } = await supabase
  .from('projects')
  .insert(newProject)
  .select()
  .single();

if (error) {
  if (error.code === 'PGRST116') {
    // RLS policy violation
    console.error('Permission denied');
  } else {
    console.error('Database error:', error);
  }
  return;
}
```

### 4. Use TypeScript Types

```typescript
import { Database } from './utils/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

const createProject = async (project: ProjectInsert) => {
  // TypeScript ensures correct shape
  const { data } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
  return data;
};
```

### 5. Subscribe to Real-time Changes

```typescript
const subscription = supabase
  .channel('projects')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'projects',
      filter: `organization_id=eq.${orgId}`,
    },
    handleProjectChange
  )
  .subscribe();

// Clean up
return () => subscription.unsubscribe();
```

## Scaling Considerations

### Performance Tips

1. **Add Indexes**: Already included in migrations
2. **Use Pagination**: 
   ```typescript
   const { data } = await supabase
     .from('projects')
     .select('*')
     .range(0, 49); // First 50 records
   ```
3. **Selective Queries**: Only fetch needed columns
   ```typescript
   .select('id, name, status')
   ```
4. **Caching**: Use React Query or SWR
5. **Batch Operations**: Insert multiple records at once

### Database Limits

- Free tier: 500 MB database
- Pro tier: 8 GB database (expandable)
- Consider archiving old projects

### Storage Limits

- Free tier: 1 GB storage
- Pro tier: 100 GB storage
- Implement image compression
- Add file size limits in UI

## Security Checklist

- ✅ RLS enabled on all tables
- ✅ Policies test for organization_id
- ✅ Storage policies check folder structure
- ✅ JWTs expire and refresh automatically
- ✅ Passwords hashed by Supabase
- ✅ HTTPS only (enforced by Supabase)
- ✅ API keys are environment variables
- ⚠️ TODO: Add rate limiting in production
- ⚠️ TODO: Add audit logs for sensitive operations
- ⚠️ TODO: Set up monitoring and alerts

## Testing Multi-Tenancy

### Test Scenarios

1. **Data Isolation**
   - Create Organization A
   - Create Organization B
   - Add project to Org A
   - Login as Org B user
   - Verify: Cannot see Org A's project ✅

2. **Permission Levels**
   - Login as Admin
   - Create/edit/delete records ✅
   - Login as Employee
   - Attempt admin actions
   - Verify: Actions blocked ✅

3. **Storage Isolation**
   - Upload photo as Org A
   - Login as Org B
   - Attempt to access Org A's photo
   - Verify: Access denied ✅

### Test Organizations

Create these test organizations:

```
Org 1: "ABC Construction"
- Admin: admin@abc.com
- Employee: worker@abc.com

Org 2: "XYZ Builders"
- Admin: admin@xyz.com
- Employee: worker@xyz.com
```

Test cross-org data access with each combination.

## Monitoring & Maintenance

### What to Monitor

1. **Database Size**: Check growth trends
2. **Storage Usage**: Monitor photo uploads
3. **Active Users**: Track organization activity
4. **Query Performance**: Use Supabase logs
5. **Error Rates**: Set up error tracking

### Regular Maintenance

- Archive completed projects
- Clean up unused storage files
- Review and optimize slow queries
- Update RLS policies as needed
- Backup database (automatic in Supabase)

## Migration from Single-Tenant

If migrating from a single-tenant setup:

1. Add organization_id to all tables
2. Create default organization
3. Update all records with org ID
4. Enable RLS
5. Add RLS policies
6. Test thoroughly
7. Update application code

## Conclusion

Your Construction Manager app now supports:
- ✅ Multiple independent organizations
- ✅ Automatic data isolation
- ✅ Role-based permissions
- ✅ Secure file storage
- ✅ Scalable architecture
- ✅ Real-time collaboration

This architecture is production-ready and follows Supabase best practices for multi-tenant SaaS applications.
