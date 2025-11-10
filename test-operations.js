// Quick test of Supabase operations
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? 'Set' : 'NOT SET');
console.log('Key:', supabaseKey ? 'Set (first 10 chars: ' + supabaseKey.substring(0, 10) + '...)' : 'NOT SET');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables!');
  console.log('\nPlease create a .env.local file with:');
  console.log('VITE_SUPABASE_URL=your_url');
  console.log('VITE_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOperations() {
  try {
    // Test 1: Read users
    console.log('\n1. Reading users...');
    const { data: users, error: usersError } = await supabase.from('users').select('*');
    if (usersError) throw usersError;
    console.log(`✓ Found ${users.length} users`);
    users.forEach(u => console.log(`  - ${u.name} (app_id: ${u.app_id})`));

    // Test 2: Update a user by app_id
    console.log('\n2. Testing update by app_id...');
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({ role: 'test-role-' + Date.now() })
      .eq('app_id', 1)
      .select();
    if (updateError) throw updateError;
    console.log(`✓ Updated user:`, updateResult);

    // Test 3: Create a new user
    console.log('\n3. Testing create user...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        name: 'Test User ' + Date.now(),
        role: 'worker',
        hourly_rate: 25
      })
      .select()
      .single();
    if (createError) throw createError;
    console.log(`✓ Created user with app_id: ${newUser.app_id}`);

    console.log('\n✅ All operations successful!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
  }
}

testOperations();
