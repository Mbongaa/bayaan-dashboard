require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndCreateTable() {
  console.log('🔍 Checking Gmail tokens table...');
  
  try {
    // Try to query the table to see if it exists
    const { data, error } = await supabase
      .from('gmail_tokens')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') {
      console.log('📋 Table does not exist, creating...');
      
      // Table doesn't exist, create it manually using SQL query
      const createSQL = `
        CREATE TABLE gmail_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          encrypted_tokens TEXT NOT NULL,
          gmail_email VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, is_active) WHERE is_active = true
        );
      `;
      
      const { error: createError } = await supabase.rpc('sql', { query: createSQL });
      
      if (createError) {
        console.log('📝 RPC failed, please run this SQL manually in Supabase SQL Editor:');
        console.log('');
        console.log(createSQL);
        console.log('');
        console.log('-- Enable Row Level Security');
        console.log('ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('-- Add security policy');
        console.log('CREATE POLICY gmail_tokens_user_policy ON gmail_tokens FOR ALL USING (auth.uid() = user_id);');
        return;
      }
      
      console.log('✅ Table created successfully!');
      
      // Add RLS
      await supabase.rpc('sql', { 
        query: 'ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;' 
      });
      
      // Add policy
      await supabase.rpc('sql', { 
        query: 'CREATE POLICY gmail_tokens_user_policy ON gmail_tokens FOR ALL USING (auth.uid() = user_id);' 
      });
      
      console.log('🔒 Security policies added!');
      
    } else {
      console.log('✅ Gmail tokens table already exists!');
      console.log('📊 Current row count:', data?.[0]?.count || 0);
    }
    
    // Test the connection by checking table structure
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'gmail_tokens');
      
    if (columns && columns.length > 0) {
      console.log('📋 Table structure confirmed:');
      columns.forEach(col => console.log(`  ✓ ${col.column_name}: ${col.data_type}`));
      console.log('');
      console.log('🎉 Database ready for Gmail integration!');
      console.log('🚀 You can now test drag & drop the Gmail module!');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

checkAndCreateTable();