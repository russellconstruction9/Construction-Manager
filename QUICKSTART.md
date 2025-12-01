# 🚀 Quick Start - Construction Manager with Supabase

## Your Supabase Setup is Complete! ✅

Everything is configured and ready to use. Here's how to get started:

## 1️⃣ Verify Connection (30 seconds)

Start your dev server:
```powershell
npm run dev
```

The app will automatically connect to Supabase using the credentials in `.env`.

## 2️⃣ Test Authentication (2 minutes)

You need to add a simple login page. Here's a minimal example:

**Create `components/Login.tsx`:**
```tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [orgName, setOrgName] = useState('');
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      const { error } = await signUp(email, password, 'Test User', orgName);
      if (error) alert(error.message);
      else alert('Check your email for confirmation!');
    } else {
      const { error } = await signIn(email, password);
      if (error) alert(error.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <input
            type="text"
            placeholder="Company Name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            style={{ width: '100%', margin: '10px 0', padding: '8px' }}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', margin: '10px 0', padding: '8px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', margin: '10px 0', padding: '8px' }}
        />
        <button type="submit" style={{ width: '100%', padding: '10px', marginTop: '10px' }}>
          {isSignUp ? 'Sign Up' : 'Login'}
        </button>
      </form>
      <button 
        onClick={() => setIsSignUp(!isSignUp)}
        style={{ marginTop: '10px', background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
      >
        {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
      </button>
    </div>
  );
};
```

## 3️⃣ Update App.tsx (1 minute)

Wrap your app with auth providers:

```tsx
import { AuthProvider } from './hooks/useAuth';
import { SupabaseProvider } from './hooks/useSupabase';
import { Login } from './components/Login';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const { user } = useAuth();
  
  if (!user) return <Login />;
  
  return (
    <SupabaseProvider>
      {/* Your existing app */}
    </SupabaseProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
```

## 4️⃣ Test It! (2 minutes)

1. Open http://localhost:5173
2. Click "Sign Up"
3. Enter:
   - Company Name: "Test Construction"
   - Email: your.email@example.com
   - Password: password123
4. Click Sign Up
5. Check Supabase dashboard to see your organization created!

## 5️⃣ View Your Data (30 seconds)

Open Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/cwwpvovbxosmkekeefst
2. Click "Table Editor"
3. See your tables:
   - **organizations** - Your company
   - **profiles** - Your user account
   - Ready for projects, tasks, etc.

## 6️⃣ Create Your First Project (2 minutes)

Open browser console and run:

```javascript
import { supabase } from './utils/supabase';

// Get your profile (includes organization_id)
const { data: profile } = await supabase.from('profiles').select('*').single();
console.log('Your profile:', profile);

// Create a project
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
    created_by: profile.id
  })
  .select()
  .single();

console.log('Created project:', project);
```

## 7️⃣ Next Steps

Now that everything works, migrate your existing code:

### Phase 1: Replace User Switching
- Remove `UserSwitcher` component
- Use real authentication instead
- Update `useDataContext` to get current user from `useAuth`

### Phase 2: Migrate Data Operations
- Replace localStorage with Supabase queries
- Start with Projects
- Then Tasks, Time Logs, etc.

### Phase 3: Add Real-time Updates
- Subscribe to table changes
- Enable live collaboration

## 📚 Where to Go Next

- **Quick Code Examples**: `SUPABASE_CHEATSHEET.md`
- **Detailed Migration**: `MIGRATION_GUIDE.md`
- **Architecture Guide**: `ARCHITECTURE.md`
- **Full Setup Info**: `SETUP_COMPLETE.md`

## 🆘 Quick Troubleshooting

**Can't connect?**
- Restart dev server after .env changes

**"Permission denied" errors?**
- Make sure you're logged in
- RLS requires authentication

**Types not working?**
- Check `utils/database.types.ts` exists
- Should be auto-generated

## 🎯 You're All Set!

Your Construction Manager is now:
- ✅ Connected to Supabase cloud database
- ✅ Multi-tenant ready (each company isolated)
- ✅ Secured with Row Level Security
- ✅ Ready for authentication
- ✅ Ready for storage (photos, receipts)
- ✅ Ready for real-time updates

**Start coding!** 🎉

---

**Pro Tip**: Keep `SUPABASE_CHEATSHEET.md` open while coding - it has all the common queries you'll need!
