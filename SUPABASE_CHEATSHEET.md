# Supabase Quick Reference - Construction Manager

Quick reference for common Supabase operations in your Construction Manager app.

## 🔐 Authentication

```typescript
import { useAuth } from './hooks/useAuth';

const { user, session, signIn, signUp, signOut } = useAuth();

// Sign up new user (creates organization)
await signUp(
  'user@example.com',
  'password123',
  'John Doe',
  'ABC Construction' // Organization name
);

// Sign in
await signIn('user@example.com', 'password123');

// Sign out
await signOut();

// Reset password
await resetPassword('user@example.com');

// Current user
console.log(user?.email);
```

## 👤 Profile & Organization

```typescript
import { useSupabase } from './hooks/useSupabase';

const { profile, organization, loading, refreshProfile } = useSupabase();

// Access profile data
console.log(profile?.full_name);
console.log(profile?.role_type); // 'Admin' or 'Employee'
console.log(profile?.organization_id);

// Access organization
console.log(organization?.name);
console.log(organization?.subscription_plan);

// Refresh after updates
await refreshProfile();
```

## 🏗️ Projects

```typescript
import { supabase } from './utils/supabase';

// Create project
const { data: project, error } = await supabase
  .from('projects')
  .insert({
    organization_id: profile.organization_id,
    name: 'New Office Building',
    address: '123 Main St',
    project_type: 'New Construction',
    status: 'In Progress',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    budget: 500000,
    created_by: user.id,
  })
  .select()
  .single();

// Get all projects
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .order('created_at', { ascending: false });

// Get single project
const { data: project } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single();

// Update project
const { error } = await supabase
  .from('projects')
  .update({ status: 'Completed' })
  .eq('id', projectId);

// Delete project
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId);

// Get projects with filtering
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'In Progress')
  .gte('budget', 100000)
  .order('start_date', { ascending: false });
```

## ✅ Tasks

```typescript
// Create task
const { data: task } = await supabase
  .from('tasks')
  .insert({
    organization_id: profile.organization_id,
    project_id: projectId,
    title: 'Install drywall',
    description: 'Second floor east wing',
    assignee_id: userId,
    due_date: '2024-03-15',
    status: 'To Do',
  })
  .select()
  .single();

// Get tasks for project
const { data: tasks } = await supabase
  .from('tasks')
  .select(`
    *,
    assignee:profiles(id, full_name, role_title)
  `)
  .eq('project_id', projectId)
  .order('due_date', { ascending: true });

// Update task status
const { error } = await supabase
  .from('tasks')
  .update({ status: 'In Progress' })
  .eq('id', taskId);

// Get my tasks
const { data: myTasks } = await supabase
  .from('tasks')
  .select('*')
  .eq('assignee_id', user.id)
  .neq('status', 'Done');
```

## ⏰ Time Tracking

```typescript
// Clock in
const { data: timeLog } = await supabase
  .from('time_logs')
  .insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    project_id: projectId,
    clock_in: new Date().toISOString(),
    clock_in_location: { lat: 40.7128, lng: -74.0060 },
  })
  .select()
  .single();

// Clock out
const clockInTime = new Date(timeLog.clock_in);
const clockOutTime = new Date();
const durationMs = clockOutTime.getTime() - clockInTime.getTime();
const hours = durationMs / (1000 * 60 * 60);
const cost = hours * profile.hourly_rate;

const { error } = await supabase
  .from('time_logs')
  .update({
    clock_out: clockOutTime.toISOString(),
    duration_ms: durationMs,
    cost: cost,
  })
  .eq('id', timeLog.id);

// Get time logs for user
const { data: logs } = await supabase
  .from('time_logs')
  .select(`
    *,
    project:projects(name, address)
  `)
  .eq('user_id', user.id)
  .order('clock_in', { ascending: false })
  .limit(50);

// Get active clock-in
const { data: activeLog } = await supabase
  .from('time_logs')
  .select('*')
  .eq('user_id', user.id)
  .is('clock_out', null)
  .single();

// Get time logs for date range
const { data: logs } = await supabase
  .from('time_logs')
  .select('*')
  .gte('clock_in', '2024-03-01')
  .lte('clock_in', '2024-03-31');
```

## 👥 Team Management

```typescript
// Get all team members
const { data: team } = await supabase
  .from('profiles')
  .select('*')
  .eq('organization_id', profile.organization_id)
  .eq('is_active', true)
  .order('full_name');

// Add team member (admin only)
const { data: newMember } = await supabase
  .from('profiles')
  .insert({
    id: newUserId, // From auth.users
    organization_id: profile.organization_id,
    email: 'newmember@example.com',
    full_name: 'Jane Smith',
    role_title: 'Carpenter',
    role_type: 'Employee',
    hourly_rate: 35.00,
  })
  .select()
  .single();

// Update team member
const { error } = await supabase
  .from('profiles')
  .update({
    role_title: 'Senior Carpenter',
    hourly_rate: 42.00,
  })
  .eq('id', userId);

// Deactivate user (don't delete)
const { error } = await supabase
  .from('profiles')
  .update({ is_active: false })
  .eq('id', userId);
```

## 📋 Punch Lists

```typescript
// Add punch list item
const { data: item } = await supabase
  .from('punch_list_items')
  .insert({
    organization_id: profile.organization_id,
    project_id: projectId,
    text: 'Fix cracked tile in bathroom',
    is_complete: false,
  })
  .select()
  .single();

// Get punch list for project
const { data: items } = await supabase
  .from('punch_list_items')
  .select('*')
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });

// Toggle completion
const { error } = await supabase
  .from('punch_list_items')
  .update({ is_complete: !currentValue })
  .eq('id', itemId);
```

## 📸 Photos

```typescript
import { uploadFile, getPublicUrl, base64ToBlob, STORAGE_BUCKETS } from './utils/supabase';

// Upload photo
const blob = base64ToBlob(imageDataUrl, 'image/jpeg');
const fileName = `${Date.now()}.jpg`;
const storagePath = `${profile.organization_id}/${projectId}/${fileName}`;

await uploadFile(STORAGE_BUCKETS.PROJECT_PHOTOS, storagePath, blob, {
  contentType: 'image/jpeg',
  upsert: false,
});

// Save photo record
const { data: photo } = await supabase
  .from('project_photos')
  .insert({
    organization_id: profile.organization_id,
    project_id: projectId,
    storage_path: storagePath,
    description: 'Foundation work complete',
    uploaded_by: user.id,
  })
  .select()
  .single();

// Get photos for project
const { data: photos } = await supabase
  .from('project_photos')
  .select('*')
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });

// Get photo URLs
const photoUrls = photos.map(p => ({
  ...p,
  url: getPublicUrl(STORAGE_BUCKETS.PROJECT_PHOTOS, p.storage_path),
}));

// Delete photo
await supabase
  .from('project_photos')
  .delete()
  .eq('id', photoId);

// Also delete from storage
await deleteFile(STORAGE_BUCKETS.PROJECT_PHOTOS, storagePath);
```

## 📦 Inventory

```typescript
// Add inventory item
const { data: item } = await supabase
  .from('inventory_items')
  .insert({
    organization_id: profile.organization_id,
    name: '2x4 Lumber',
    quantity: 100,
    unit: 'pieces',
    low_stock_threshold: 20,
  })
  .select()
  .single();

// Get all inventory
const { data: inventory } = await supabase
  .from('inventory_items')
  .select('*')
  .order('name');

// Update quantity
const { error } = await supabase
  .from('inventory_items')
  .update({ quantity: newQuantity })
  .eq('id', itemId);

// Get low stock items
const { data: lowStock } = await supabase
  .from('inventory_items')
  .select('*')
  .filter('quantity', 'lte', 'low_stock_threshold');
```

## 💰 Estimates

```typescript
// Create estimate with items
const { data: estimate } = await supabase
  .from('estimates')
  .insert({
    organization_id: profile.organization_id,
    project_id: projectId,
    name: 'Phase 1 Estimate',
    status: 'Draft',
    total_amount: 0, // Will update after items
    total_estimated_hours: 0,
    created_by: user.id,
  })
  .select()
  .single();

// Add estimate items
const items = [
  {
    organization_id: profile.organization_id,
    estimate_id: estimate.id,
    item_type: 'Labor',
    description: 'Foundation work',
    quantity: 80,
    unit: 'hours',
    unit_cost: 50,
    total_cost: 4000,
    estimated_hours: 80,
  },
  // ... more items
];

const { error } = await supabase
  .from('estimate_items')
  .insert(items);

// Calculate totals
const { data: itemsData } = await supabase
  .from('estimate_items')
  .select('total_cost, estimated_hours')
  .eq('estimate_id', estimate.id);

const totalAmount = itemsData.reduce((sum, i) => sum + i.total_cost, 0);
const totalHours = itemsData.reduce((sum, i) => sum + (i.estimated_hours || 0), 0);

// Update estimate totals
await supabase
  .from('estimates')
  .update({ total_amount: totalAmount, total_estimated_hours: totalHours })
  .eq('id', estimate.id);

// Get estimate with items
const { data: fullEstimate } = await supabase
  .from('estimates')
  .select(`
    *,
    items:estimate_items(*)
  `)
  .eq('id', estimateId)
  .single();

// Update estimate status
await supabase
  .from('estimates')
  .update({ status: 'Approved' })
  .eq('id', estimateId);
```

## 💳 Expenses

```typescript
// Add expense
const { data: expense } = await supabase
  .from('expenses')
  .insert({
    organization_id: profile.organization_id,
    project_id: projectId,
    description: 'Lumber purchase',
    amount: 1250.50,
    expense_date: '2024-03-01',
    category: 'Material',
    created_by: user.id,
  })
  .select()
  .single();

// Get expenses for project
const { data: expenses } = await supabase
  .from('expenses')
  .select('*')
  .eq('project_id', projectId)
  .order('expense_date', { ascending: false });

// Get expenses by date range
const { data: expenses } = await supabase
  .from('expenses')
  .select('*')
  .gte('expense_date', '2024-03-01')
  .lte('expense_date', '2024-03-31');

// Delete expense
await supabase
  .from('expenses')
  .delete()
  .eq('id', expenseId);
```

## 🔄 Real-time Subscriptions

```typescript
import { useEffect } from 'react';

// Subscribe to project changes
useEffect(() => {
  const channel = supabase
    .channel('projects-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // 'INSERT', 'UPDATE', 'DELETE', or '*'
        schema: 'public',
        table: 'projects',
        filter: `organization_id=eq.${profile.organization_id}`,
      },
      (payload) => {
        console.log('Change detected:', payload);
        // Refresh your data
        refetchProjects();
      }
    )
    .subscribe();

  // Cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}, [profile?.organization_id]);

// Multiple table subscriptions
useEffect(() => {
  const channel = supabase
    .channel('all-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'projects' },
      handleProjectChange
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      handleTaskChange
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

## 📊 Advanced Queries

```typescript
// Join tables
const { data } = await supabase
  .from('tasks')
  .select(`
    *,
    project:projects(name, address),
    assignee:profiles(full_name, email)
  `)
  .eq('status', 'In Progress');

// Count records
const { count } = await supabase
  .from('projects')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'In Progress');

// Aggregation (use RPC functions)
const { data } = await supabase.rpc('get_project_stats', {
  p_project_id: projectId,
});

// Pagination
const pageSize = 20;
const page = 0;
const { data } = await supabase
  .from('projects')
  .select('*')
  .range(page * pageSize, (page + 1) * pageSize - 1);

// Full text search
const { data } = await supabase
  .from('projects')
  .select('*')
  .textSearch('name', 'office building');
```

## 🛠️ Error Handling

```typescript
const { data, error } = await supabase
  .from('projects')
  .insert(newProject)
  .select()
  .single();

if (error) {
  switch (error.code) {
    case 'PGRST116': // RLS violation
      console.error('Permission denied');
      break;
    case '23505': // Unique constraint violation
      console.error('Record already exists');
      break;
    case '23503': // Foreign key violation
      console.error('Invalid reference');
      break;
    default:
      console.error('Database error:', error.message);
  }
  return;
}

// Success
console.log('Created:', data);
```

## 🔍 Debugging

```typescript
// Enable debug mode
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
});

// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Check profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
console.log('Profile:', profile);

// Test RLS
const { data, error } = await supabase
  .from('projects')
  .select('*');
console.log('Projects visible:', data?.length);
console.log('Error:', error);
```

## 📝 TypeScript Types

```typescript
import { Database } from './utils/database.types';

// Table types
type Project = Database['public']['Tables']['projects']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

// Insert types (optional fields)
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

// Update types (all optional)
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

// Use in functions
const createProject = async (project: ProjectInsert): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
  
  if (error) {
    console.error(error);
    return null;
  }
  
  return data;
};
```

## 🚀 Performance Tips

```typescript
// Select only needed columns
const { data } = await supabase
  .from('projects')
  .select('id, name, status'); // Not '*'

// Use indexes (already created in migrations)
// Always filter on indexed columns first

// Batch inserts
const { data } = await supabase
  .from('tasks')
  .insert([task1, task2, task3]); // Array of tasks

// Use explain for slow queries
const { data } = await supabase
  .from('projects')
  .select('*')
  .explain({ analyze: true });
```

---

**Pro Tip**: Always check for errors and handle them appropriately. Supabase errors contain useful information in `error.message`, `error.code`, and `error.details`.
