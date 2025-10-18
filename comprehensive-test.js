const { google } = require('googleapis');

async function comprehensiveTest() {
  try {
    console.log('🔍 COMPREHENSIVE GOOGLE SHEETS VERIFICATION\\n');
    
    // 1. Check environment variables
    console.log('1️⃣ ENVIRONMENT VARIABLES:');
    const config = {
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY
    };
    
    console.log('   ✅ Spreadsheet ID:', config.spreadsheetId ? 'SET ✓' : '❌ MISSING');
    console.log('   ✅ Service Account:', config.serviceAccountEmail ? 'SET ✓' : '❌ MISSING');
    console.log('   ✅ Private Key:', config.privateKey ? 'SET ✓' : '❌ MISSING');
    console.log('   📊 Private Key Length:', config.privateKey?.length || 0);
    
    if (!config.spreadsheetId || !config.serviceAccountEmail || !config.privateKey) {
      throw new Error('❌ MISSING CONFIGURATION');
    }
    
    // 2. Test JWT creation
    console.log('\\n2️⃣ JWT AUTHENTICATION:');
    const privateKey = config.privateKey.replace(/\\\\n/g, '\\n');
    
    try {
      const auth = new google.auth.JWT(
        config.serviceAccountEmail,
        undefined,
        privateKey,
        [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/spreadsheets'
        ]
      );
      console.log('   ✅ JWT client created successfully');
      
      // Test JWT token generation
      const token = await auth.getAccessToken();
      console.log('   ✅ Access token generated:', token ? 'SUCCESS ✓' : 'FAILED ❌');
      
    } catch (jwtError) {
      console.error('   ❌ JWT creation failed:', jwtError.message);
      throw jwtError;
    }
    
    // 3. Test Google Sheets API
    console.log('\\n3️⃣ GOOGLE SHEETS API:');
    try {
      const auth = new google.auth.JWT(
        config.serviceAccountEmail,
        undefined,
        privateKey,
        [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/spreadsheets'
        ]
      );
      
      const sheets = google.sheets({ version: 'v4', auth });
      
      console.log('   📡 Testing spreadsheet access...');
      const response = await sheets.spreadsheets.get({
        spreadsheetId: config.spreadsheetId
      });
      
      console.log('   ✅ Spreadsheet access SUCCESS ✓');
      console.log('   📋 Title:', response.data.properties?.title);
      
      // List sheets
      const sheetList = response.data.sheets?.map(sheet => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId
      }));
      
      console.log('   📊 Total sheets:', sheetList?.length || 0);
      console.log('   📋 Sheet list:', sheetList?.map(s => s.title));
      
      // Find khoa sheets
      const khoaSheets = sheetList?.filter(sheet => 
        sheet.title && (sheet.title.includes('K') || sheet.title.toLowerCase().includes('khoa'))
      );
      
      console.log('   🎓 Khoa sheets found:', khoaSheets?.length || 0);
      console.log('   🎓 Khoa list:', khoaSheets?.map(s => s.title));
      
      // Test reading data
      if (khoaSheets && khoaSheets.length > 0) {
        const firstKhoa = khoaSheets[0];
        console.log(`\\n   📖 Reading data from ${firstKhoa.title}...`);
        
        const dataResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: config.spreadsheetId,
          range: `'${firstKhoa.title}'!A:Z`
        });
        
        const data = dataResponse.data.values || [];
        console.log(`   📊 Found ${data.length} rows`);
        
        if (data.length > 0) {
          console.log('   📄 Headers:', data[0].slice(0, 5)); // First 5 columns
          if (data.length > 1) {
            console.log('   👤 Sample student:', data[1].slice(0, 5));
          }
        }
      }
      
      return {
        success: true,
        spreadsheetTitle: response.data.properties?.title,
        totalSheets: sheetList?.length || 0,
        khoaSheets: khoaSheets?.length || 0,
        khoaList: khoaSheets?.map(s => s.title) || []
      };
      
    } catch (sheetsError) {
      console.error('   ❌ Google Sheets API failed:', sheetsError.message);
      console.error('   📋 Error code:', sheetsError.code);
      console.error('   📋 Error status:', sheetsError.status);
      
      // Provide specific guidance
      if (sheetsError.code === 403) {
        console.log('\\n   🔧 403 ERROR SOLUTIONS:');
        console.log('   1. Enable Google Sheets API in Google Cloud Console');
        console.log('   2. Share spreadsheet with service account email');
        console.log('   3. Check service account permissions');
        console.log('   4. Verify service account is active');
      } else if (sheetsError.code === 404) {
        console.log('\\n   🔧 404 ERROR SOLUTIONS:');
        console.log('   1. Check spreadsheet ID is correct');
        console.log('   2. Ensure spreadsheet is shared with service account');
      }
      
      throw sheetsError;
    }
    
  } catch (error) {
    console.error('\\n❌ COMPREHENSIVE TEST FAILED:', error.message);
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
comprehensiveTest().then(result => {
  console.log('\\n🎯 FINAL RESULT:', result);
  
  if (result.success) {
    console.log('\\n🎉 SETUP IS CORRECT!');
    console.log('✅ Google Sheets API is working');
    console.log('✅ Service Account has proper permissions');
    console.log('✅ Spreadsheet is accessible');
    console.log('✅ Data can be read successfully');
    console.log('\\n🚀 The system should now work with real Google Sheets data!');
  } else {
    console.log('\\n⚠️ SETUP NEEDS FIXING');
    console.log('Please follow the error messages above to fix the configuration');
  }
}).catch(error => {
  console.error('💥 TEST CRASHED:', error);
});