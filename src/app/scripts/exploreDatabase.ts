/* eslint-disable @typescript-eslint/no-unused-vars */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client for full database access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TableInfo {
  table_name: string;
  table_schema: string;
  is_insertable_into: string;
  table_type: string;
}

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  ordinal_position: number;
}

interface ForeignKeyInfo {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  constraint_name: string;
}

interface PolicyInfo {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string | null;
  with_check: string | null;
}

async function exploreDatabase() {
  console.log('========================================');
  console.log('SUPABASE DATABASE EXPLORATION');
  console.log('========================================\n');
  console.log(`Connected to: ${supabaseUrl}\n`);

  try {
    // 1. Get all tables
    console.log('📋 FETCHING TABLES...');
    console.log('----------------------------------------');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema, is_insertable_into, table_type')
      .in('table_schema', ['public', 'auth'])
      .order('table_schema', { ascending: true })
      .order('table_name', { ascending: true });

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      
      // Try alternative approach - list tables directly
      console.log('\nTrying alternative approach...\n');
      
      // Get public schema tables using SQL
      const { data: publicTables, error: publicError } = await supabase.rpc('get_tables_info', {
        schema_name: 'public'
      }).single();
      
      if (publicError) {
        console.log('RPC not available, trying direct queries...\n');
        
        // Try to query known common tables
        const commonTables = ['users', 'profiles', 'sessions', 'posts', 'comments'];
        console.log('Checking for common table names:\n');
        
        for (const tableName of commonTables) {
          try {
            const { count, error } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });
            
            if (!error) {
              console.log(`✅ Table found: ${tableName} (${count} rows)`);
            }
          } catch (e) {
            // Table doesn't exist
          }
        }
      }
    } else if (tables && tables.length > 0) {
      const publicTables = tables.filter((t: TableInfo) => t.table_schema === 'public');
      const authTables = tables.filter((t: TableInfo) => t.table_schema === 'auth');
      
      console.log(`Found ${publicTables.length} public tables and ${authTables.length} auth tables\n`);
      
      // 2. For each public table, get detailed information
      for (const table of publicTables) {
        console.log(`\n📊 TABLE: ${table.table_name}`);
        console.log('=====================================');
        console.log(`Type: ${table.table_type}`);
        console.log(`Insertable: ${table.is_insertable_into}`);
        
        // Get columns
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('*')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position');
        
        if (columns && columns.length > 0) {
          console.log('\nColumns:');
          columns.forEach((col: ColumnInfo) => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
            console.log(`  - ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
          });
        }
        
        // Get row count
        try {
          const { count, error } = await supabase
            .from(table.table_name)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            console.log(`\nRow count: ${count}`);
          }
        } catch (e) {
          console.log('\nRow count: Unable to fetch');
        }
        
        // Get sample data (first 3 rows)
        try {
          const { data: sampleData, error } = await supabase
            .from(table.table_name)
            .select('*')
            .limit(3);
          
          if (!error && sampleData && sampleData.length > 0) {
            console.log('\nSample data (first 3 rows):');
            console.log(JSON.stringify(sampleData, null, 2));
          }
        } catch (e) {
          console.log('\nSample data: Unable to fetch');
        }
      }
      
      // 3. Get foreign key relationships
      console.log('\n\n🔗 FOREIGN KEY RELATIONSHIPS');
      console.log('=====================================');
      
      const { data: foreignKeys, error: fkError } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('constraint_type', 'FOREIGN KEY')
        .eq('table_schema', 'public');
      
      if (foreignKeys && foreignKeys.length > 0) {
        console.log(`Found ${foreignKeys.length} foreign key relationships\n`);
        foreignKeys.forEach((fk: any) => {
          console.log(`  ${fk.table_name} -> References another table via ${fk.constraint_name}`);
        });
      } else {
        console.log('No foreign key relationships found in public schema');
      }
      
      // 4. Get RLS policies
      console.log('\n\n🛡️ ROW LEVEL SECURITY POLICIES');
      console.log('=====================================');
      
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies_info', { schema_name: 'public' })
        .single();
      
      if (policiesError) {
        console.log('Unable to fetch RLS policies (may require additional permissions)');
      } else if (policies) {
        console.log('RLS Policies found:', policies);
      }
      
      // 5. Check auth schema (if accessible)
      if (authTables.length > 0) {
        console.log('\n\n🔐 AUTH SCHEMA TABLES');
        console.log('=====================================');
        authTables.forEach((table: TableInfo) => {
          console.log(`  - ${table.table_name}`);
        });
      }
    } else {
      console.log('No tables found in database');
      
      // Try to list tables using a different approach
      console.log('\nAttempting to discover tables...\n');
      
      // Try common Supabase table patterns
      const potentialTables = [
        'profiles', 'users', 'user_profiles', 'accounts',
        'sessions', 'posts', 'comments', 'messages',
        'organizations', 'teams', 'projects', 'tasks',
        'files', 'uploads', 'media', 'documents'
      ];
      
      for (const tableName of potentialTables) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            console.log(`✅ Found table: ${tableName}`);
            
            // Get column info for found table
            const { data: firstRow, error: rowError } = await supabase
              .from(tableName)
              .select('*')
              .limit(1)
              .single();
            
            if (firstRow) {
              console.log(`   Columns: ${Object.keys(firstRow).join(', ')}`);
              console.log(`   Row count: ${count}\n`);
            }
          }
        } catch (e) {
          // Table doesn't exist, continue
        }
      }
    }
    
    // 6. Test authentication capabilities
    console.log('\n\n🔑 AUTHENTICATION STATUS');
    console.log('=====================================');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (user) {
      console.log('Authenticated as service role');
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
    } else {
      console.log('Using service role key (no user session)');
    }
    
    console.log('\n========================================');
    console.log('EXPLORATION COMPLETE');
    console.log('========================================');
    
  } catch (error) {
    console.error('Unexpected error during exploration:', error);
  }
}

// Run the exploration
exploreDatabase().then(() => {
  console.log('\nDatabase exploration finished');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});