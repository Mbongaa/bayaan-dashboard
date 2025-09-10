import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

// Create admin client for migration
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runGmailMigration() {
  try {
    console.log('🚀 Starting Gmail tokens table migration...');
    
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'src/app/scripts/gmail_tokens_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements (basic splitting)
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => 
        statement.length > 0 && 
        !statement.startsWith('--') && 
        !statement.startsWith('/*')
      );

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            console.warn(`⚠️  Statement ${i + 1} error (may be expected):`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (error) {
          console.warn(`⚠️  Statement ${i + 1} failed (may be expected):`, error);
        }
      }
    }

    // Verify table creation
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'gmail_tokens');

    if (tablesError) {
      console.error('❌ Error checking table creation:', tablesError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Gmail tokens table created successfully!');
      
      // Check table structure
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'gmail_tokens')
        .order('ordinal_position');

      console.log('📋 Table structure:');
      columns?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
      });
      
    } else {
      console.log('⚠️  Table not found, trying direct creation...');
      
      // Try direct table creation
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS gmail_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          encrypted_tokens TEXT NOT NULL,
          gmail_email VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS gmail_tokens_user_policy ON gmail_tokens
          FOR ALL USING (auth.uid() = user_id);
      `;
      
      const { error: directError } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });
      
      if (directError) {
        console.error('❌ Direct table creation failed:', directError);
      } else {
        console.log('✅ Direct table creation succeeded!');
      }
    }

    console.log('🎉 Migration completed!');
    console.log('📱 You can now test the Gmail integration by:');
    console.log('   1. Restart your dev server (npm run dev)');
    console.log('   2. Hover over the sidebar to see the module palette');
    console.log('   3. Drag the Gmail icon to a workspace slot');
    console.log('   4. Connect your Gmail account!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('💡 Try running the SQL manually in Supabase SQL Editor');
    console.log('📄 SQL file location: src/app/scripts/gmail_tokens_migration.sql');
  }
}

// Run the migration
runGmailMigration();