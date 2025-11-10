# Row Level Security (RLS) Configuration Notes

## Current Status

### ✅ RLS is Enabled
All tables in the `public` schema have Row Level Security enabled:
- `users`
- `projects`
- `tasks`
- `time_logs`
- `inventory`
- `project_photos`

### ⚠️ Security Warnings

The Supabase Security Advisor has flagged that all tables have policies allowing **authenticated** role access with `using (true)` and `with_check (true)`, which means:

1. **Any authenticated user can read all data** from all tables
2. **Any authenticated user can insert/update/delete all data** in all tables

### Current Policy Structure

All tables have this policy:
```sql
CREATE POLICY "Enable all operations for authenticated users"
ON table_name
TO authenticated
USING (true)
WITH CHECK (true);
```

## Recommendations for Production

### Option 1: No Authentication System (Current State - Development Only)
If you're NOT implementing Supabase Auth and want to keep using the app with just the anon key:
- The current setup is acceptable for **development/testing only**
- All users share the same data pool
- There's no user-level data isolation

### Option 2: Implement Authentication (Recommended for Production)

If you plan to add authentication, you should update RLS policies to:

#### 1. Users Table
```sql
-- Users can read all users (for team features)
CREATE POLICY "authenticated_users_read_all"
ON users FOR SELECT
TO authenticated
USING (true);

-- Users can only update their own profile
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id::text)
WITH CHECK ((select auth.uid()) = id::text);
```

#### 2. Projects Table
```sql
-- All authenticated users can read projects (team feature)
CREATE POLICY "authenticated_projects_read"
ON projects FOR SELECT
TO authenticated
USING (true);

-- Only admins/managers can create projects
CREATE POLICY "admin_projects_create"
ON projects FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM users WHERE id::text = (select auth.uid())) 
  IN ('admin', 'manager')
);
```

#### 3. Tasks Table
```sql
-- Users can see all tasks
CREATE POLICY "authenticated_tasks_read"
ON tasks FOR SELECT
TO authenticated
USING (true);

-- Users can update tasks assigned to them
CREATE POLICY "users_update_assigned_tasks"
ON tasks FOR UPDATE
TO authenticated
USING (assigned_to::text = (select auth.uid()))
WITH CHECK (assigned_to::text = (select auth.uid()));
```

#### 4. Time Logs Table
```sql
-- Users can only see their own time logs
CREATE POLICY "users_read_own_time_logs"
ON time_logs FOR SELECT
TO authenticated
USING (user_id::text = (select auth.uid()));

-- Users can only create their own time logs
CREATE POLICY "users_create_own_time_logs"
ON time_logs FOR INSERT
TO authenticated
WITH CHECK (user_id::text = (select auth.uid()));
```

#### 5. Inventory Table
```sql
-- All authenticated users can read inventory
CREATE POLICY "authenticated_inventory_read"
ON inventory FOR SELECT
TO authenticated
USING (true);

-- Workers can update quantity, managers can update all
CREATE POLICY "authenticated_inventory_update"
ON inventory FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

## Migration Path

### Phase 1: Current State (No Auth)
- Keep existing policies
- Use app with `anon` key
- All data is shared across all users
- **FOR DEVELOPMENT ONLY**

### Phase 2: Add Authentication
1. Enable Supabase Auth provider (email/password, OAuth, etc.)
2. Update app to use auth.signIn/signOut
3. Map existing users table to auth.users
4. Update RLS policies to use auth.uid()
5. Test thoroughly in development

### Phase 3: Tighten Security
1. Remove overly permissive policies
2. Implement role-based access control
3. Add audit logging
4. Regular security reviews

## Performance Considerations

The current unused indexes are acceptable since there's minimal data. As data grows:
- Index on `user_id` in time_logs will become useful
- Index on `project_id` in tasks will improve performance
- Index on `status` fields helps filtering

## Links
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database Advisor](https://supabase.com/docs/guides/database/database-advisors)
- [Security Best Practices](https://supabase.com/docs/guides/database/database-linter)
