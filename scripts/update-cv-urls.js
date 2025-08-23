const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateCVUrls() {
  try {
    console.log('🔍 Fetching all interview records...');
    
    // Get all records with CV URLs
    const { data: interviews, error: fetchError } = await supabase
      .from('interviews')
      .select('id, resume_file_name')
      .not('resume_file_name', 'is', null);
    
    if (fetchError) {
      console.error('❌ Error fetching interviews:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${interviews.length} interview records`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Update each record
    for (const interview of interviews) {
      if (!interview.resume_file_name) continue;
      
      // Check if it needs updating
      if (interview.resume_file_name.includes('/api/dashboard-resume-url')) {
        const newUrl = interview.resume_file_name.replace(
          '/api/dashboard-resume-url', 
          '/api/cv-preview'
        );
        
        console.log(`🔄 Updating record ${interview.id}:`);
        console.log(`   Old: ${interview.resume_file_name}`);
        console.log(`   New: ${newUrl}`);
        
        const { error: updateError } = await supabase
          .from('interviews')
          .update({ resume_file_name: newUrl })
          .eq('id', interview.id);
        
        if (updateError) {
          console.error(`❌ Error updating record ${interview.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`✅ Updated record ${interview.id}`);
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n🎉 Update Complete!');
    console.log(`✅ Updated: ${updatedCount} records`);
    console.log(`⏭️  Skipped: ${skippedCount} records (already correct)`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the update
updateCVUrls();
