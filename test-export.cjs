const { exportService } = require('./src/lib/export/services/ExportService.js');
const { db } = require('./src/server/db.js');

// Test the export functionality
async function testExport() {
  try {
    // Get a brief ID from the database
    const brief = await db.brief.findFirst();
    if (!brief) {
      console.log('No briefs found in database');
      return;
    }
    
    console.log('Testing export for brief:', brief.id);
    
    // Test export request
    const request = {
      type: 'brief',
      format: 'markdown',
      id: brief.id,
      options: {
        includeReferences: true,
        includeMetadata: true
      }
    };
    
    // Test export
    const result = await exportService.export(request, 'test-user-123');
    
    console.log('Export result:', result);
    
    if (result.success) {
      console.log('✅ Export successful!');
      console.log('Filename:', result.filename);
      console.log('Size:', result.size);
    } else {
      console.log('❌ Export failed:', result.error);
    }
    
  } catch (error) {
    console.error('Error during export test:', error);
  }
}

testExport();
