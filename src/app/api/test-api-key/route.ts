import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET() {
  try {
    console.log("🔑 Testing with API Key...")
    
    const API_KEY = "AQ.Ab8RN6LRnJv2pTrue0kMYMGWyaX6irEYrAdoSzDsyeN6ZuQ76w"
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
    
    if (!API_KEY || !SPREADSHEET_ID) {
      return NextResponse.json({
        success: false,
        error: "Missing API key or spreadsheet ID"
      })
    }
    
    // Test with Google Drive API first (supports API keys)
    const drive = google.drive({ 
      version: "v3",
      auth: API_KEY
    })
    
    console.log("📁 Testing Drive API access...")
    const fileResponse = await drive.files.get({
      fileId: SPREADSHEET_ID,
      fields: "name, id, mimeType"
    })
    
    console.log("✅ Drive API SUCCESS!")
    console.log("File:", fileResponse.data.name)
    
    return NextResponse.json({
      success: true,
      message: "API Key works with Drive API",
      file: {
        name: fileResponse.data.name,
        id: fileResponse.data.id,
        mimeType: fileResponse.data.mimeType
      }
    })
    
  } catch (error: any) {
    console.error("❌ API Key test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: "API Key may not have proper permissions or Google Sheets API requires OAuth2"
    }, { status: 500 })
  }
}
