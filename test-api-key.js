const { google } = require('googleapis');

async function testWithApiKey() {
  try {
    console.log('🔑 Testing Google Sheets with API Key...');
    
    const API_KEY = 'AQ.Ab8RN6LRnJv2pTrue0kMYMGWyaX6irEYrAdoSzDsyeN6ZuQ76w';
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    
    console.log('📋 Config:', {
      apiKey: API_KEY ? 'SET' : 'MISSING',
      spreadsheetId: SPREADSHEET_ID ? 'SET' : 'MISSING'
    });
    
    if (!API_KEY || !SPREADSHEET_ID) {
      throw new Error('Missing API key or spreadsheet ID');
    }
    
    // Create sheets client with API key
    const sheets = google.sheets({ 
      version: 'v4',
      auth: API_KEY
    });
    
    console.log('🔗 Testing spreadsheet access...');
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    
    console.log('✅ SUCCESS! Spreadsheet title:', response.data.properties?.title);
    
    // List sheets
    const sheetList = response.data.sheets?.map(sheet => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId
    }));
    
    console.log('📋 Available sheets:', sheetList);
    
    // Find khoa sheets
    const khoaSheets = sheetList?.filter(sheet => 
      sheet.title && (sheet.title.includes('K') || sheet.title.toLowerCase().includes('khoa'))
    );
    
    console.log('🎓 Khoa sheets found:', khoaSheets);
    
    // Test reading first khoa sheet
    if (khoaSheets.length > 0) {
      const firstKhoa = khoaSheets[0];
      console.log(`📖 Reading data from ${firstKhoa.title}...`);
      
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${firstKhoa.title}'!A:Z`
      });
      
      const data = dataResponse.data.values || [];
      console.log(`📊 Found ${data.length} rows in ${firstKhoa.title}`);
      
      if (data.length > 0) {
        console.log('📄 Headers:', data[0]);
        if (data.length > 1) {
          console.log('👤 Sample student:', data[1]);
        }
      }
    }
    
    return {
      success: true,
      spreadsheetTitle: response.data.properties?.title,
      totalSheets: sheetList?.length || 0,
      khoaSheets: khoaSheets?.length || 0
    };
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Code:', error.code);
    console.error('Status:', error.status);
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

// Load environment variables
require('dotenv').config();

// Run test
testWithApiKey().then(result => {
  console.log('\\n📊 Test result:', result);
}).catch(error => {
  console.error('💥 Test failed:', error);
});