import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client for full database access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exploreTablesInDetail() {
  console.log('========================================');
  console.log('DETAILED DATABASE STRUCTURE ANALYSIS');
  console.log('========================================\n');

  const tables = ['users', 'profiles', 'sessions', 'posts', 'comments'];
  
  for (const tableName of tables) {
    console.log(`\n📊 TABLE: ${tableName}`);
    console.log('=====================================');
    
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`Error accessing table: ${countError.message}`);
        continue;
      }
      
      console.log(`Total rows: ${count || 0}`);
      
      // Get sample data to understand structure
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);
      
      if (sampleError) {
        console.log(`Error fetching data: ${sampleError.message}`);
        continue;
      }
      
      // Analyze columns from sample data
      if (sampleData && sampleData.length > 0) {
        console.log('\nColumn Structure:');
        const firstRow = sampleData[0];
        const columns = Object.keys(firstRow);
        
        columns.forEach(col => {
          const value = firstRow[col];
          let type = typeof value;
          
          if (value === null) {
            // Check other rows for non-null values
            for (let i = 1; i < sampleData.length; i++) {
              if (sampleData[i][col] !== null) {
                type = typeof sampleData[i][col];
                break;
              }
            }
          }
          
          // Special type detection
          if (type === 'string') {
            if (col.includes('id') || col.includes('_id')) {
              type = 'uuid/string';
            } else if (col.includes('email')) {
              type = 'email/string';
            } else if (col.includes('date') || col.includes('_at') || col.includes('created') || col.includes('updated')) {
              type = 'timestamp/string';
            } else if (col.includes('url') || col.includes('avatar')) {
              type = 'url/string';
            }
          }
          
          const nullable = sampleData.some(row => row[col] === null) ? ' (nullable)' : '';
          console.log(`  - ${col}: ${type}${nullable}`);
        });
        
        console.log('\nSample Data:');
        console.log(JSON.stringify(sampleData, null, 2));
      } else {
        console.log('No data in table');
        
        // Try to get table structure even without data
        // Attempt an insert with empty object to see required fields
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({})
          .select()
          .single();
        
        if (insertError) {
          console.log('\nTable constraints from error:');
          console.log(insertError.message);
        }
      }
      
    } catch (error) {
      console.log(`Unexpected error with table ${tableName}:`, error);
    }
  }
  
  // Check for additional tables by trying auth.users
  console.log('\n\n🔐 CHECKING AUTH.USERS TABLE');
  console.log('=====================================');
  
  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log(`Auth error: ${authError.message}`);
    } else {
      console.log(`Total auth users: ${authUsers.users.length}`);
      
      if (authUsers.users.length > 0) {
        console.log('\nAuth User Structure:');
        const firstUser = authUsers.users[0];
        console.log('  - id: uuid');
        console.log('  - email: string');
        console.log('  - created_at: timestamp');
        console.log('  - updated_at: timestamp');
        console.log('  - email_confirmed_at: timestamp (nullable)');
        console.log('  - phone: string (nullable)');
        console.log('  - confirmed_at: timestamp (nullable)');
        console.log('  - last_sign_in_at: timestamp (nullable)');
        
        console.log('\nSample auth user:');
        console.log(JSON.stringify({
          id: firstUser.id,
          email: firstUser.email,
          created_at: firstUser.created_at,
          email_confirmed_at: firstUser.email_confirmed_at,
        }, null, 2));
      }
    }
  } catch (error) {
    console.log('Unable to access auth.users:', error);
  }
  
  // Check Storage buckets
  console.log('\n\n📦 STORAGE BUCKETS');
  console.log('=====================================');
  
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`Storage error: ${bucketsError.message}`);
    } else if (buckets && buckets.length > 0) {
      console.log(`Found ${buckets.length} storage buckets:`);
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    } else {
      console.log('No storage buckets found');
    }
  } catch (error) {
    console.log('Unable to access storage:', error);
  }
  
  // Try to discover relationships
  console.log('\n\n🔗 ANALYZING RELATIONSHIPS');
  console.log('=====================================');
  
  // Check if profiles references users
  try {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single();
    
    if (profileData) {
      const columns = Object.keys(profileData);
      const possibleFKs = columns.filter(col => 
        col.includes('user_id') || 
        col.includes('user') || 
        col === 'id'
      );
      
      if (possibleFKs.length > 0) {
        console.log('Potential relationships found:');
        console.log(`  profiles -> users (via ${possibleFKs.join(', ')})`);
      }
    }
  } catch (error) {
    console.log('Error analyzing relationships');
  }
  
  // Check posts and comments for relationships
  const relTables = ['posts', 'comments'];
  for (const table of relTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
        .single();
      
      if (data) {
        const columns = Object.keys(data);
        const fkColumns = columns.filter(col => 
          col.includes('_id') || 
          col.includes('user') || 
          col.includes('post') ||
          col.includes('author') ||
          col.includes('profile')
        );
        
        if (fkColumns.length > 0) {
          console.log(`  ${table} has potential foreign keys: ${fkColumns.join(', ')}`);
        }
      }
    } catch (error) {
      // Table might be empty
    }
  }
  
  console.log('\n========================================');
  console.log('ANALYSIS COMPLETE');
  console.log('========================================');
}

// Run the detailed exploration
exploreTablesInDetail().then(() => {
  console.log('\nDetailed exploration finished');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});