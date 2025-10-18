const { google } = require('googleapis');

async function testGoogleSheets() {
  try {
    console.log('🔍 Testing Google Sheets connection...');
    
    // Configuration
    const config = {
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };
    
    console.log('📋 Config check:', {
      hasSpreadsheetId: !!config.spreadsheetId,
      hasServiceAccountEmail: !!config.serviceAccountEmail,
      hasPrivateKey: !!config.privateKey,
      privateKeyLength: config.privateKey?.length,
      spreadsheetId: config.spreadsheetId,
      serviceAccountEmail: config.serviceAccountEmail
    });
    
    if (!config.spreadsheetId || !config.serviceAccountEmail || !config.privateKey) {
      throw new Error('Missing configuration');
    }
    
    // Create JWT auth
    console.log('🔐 Creating JWT auth...');
    const auth = new google.auth.JWT(
      config.serviceAccountEmail,
      null,
      config.privateKey,
      [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    );
    
    // Create sheets client
    console.log('📡 Creating Sheets client...');
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Test connection
    console.log('🔗 Testing spreadsheet access...');
    const response = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId
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
    
    if (error.code === 403) {
      console.log('\n🔧 SOLUTIONS:');
      console.log('1. Enable Google Sheets API in Google Cloud Console');
      console.log('2. Share spreadsheet with service account email');
      console.log('3. Check service account permissions');
    }
    
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
testGoogleSheets().then(result => {
  console.log('\n📊 Test result:', result);
}).catch(error => {
  console.error('💥 Test failed:', error);
});