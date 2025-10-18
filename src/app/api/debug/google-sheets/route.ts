import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET() {
  try {
    console.log("🔍 Debugging Google Sheets configuration...")
    
    const config = {
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
      privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY
    }
    
    if (!config.spreadsheetId || !config.serviceAccountEmail || !config.privateKey) {
      return NextResponse.json({
        success: false,
        error: "Missing configuration",
        config
      })
    }
    
    const privateKey = config.privateKey.replace(/\\n/g, "\n")
    
    const auth = new google.auth.JWT(
      config.serviceAccountEmail,
      undefined,
      privateKey,
      [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/spreadsheets"
      ]
    )
    
    const sheets = google.sheets({ version: "v4", auth })
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId
    })
    
    const sheetList = response.data.sheets?.map(sheet => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
      rowCount: sheet.properties?.gridProperties?.rowCount,
      columnCount: sheet.properties?.gridProperties?.columnCount
    }))
    
    return NextResponse.json({
      success: true,
      message: "Google Sheets connection successful!",
      data: {
        spreadsheetTitle: response.data.properties?.title,
        sheets: sheetList,
        totalSheets: sheetList?.length || 0
      }
    })
    
  } catch (error: any) {
    console.error("❌ Google Sheets debug failed:", error)
    
    let errorMessage = error.message || "Unknown error"
    
    if (error.code === 403) {
      if (error.message?.includes("unregistered callers")) {
        errorMessage = "Service Account authentication failed. Check if Google Sheets API is enabled and service account has proper permissions."
      } else if (error.message?.includes("accessNotConfigured")) {
        errorMessage = "Google Sheets API is not enabled for this project."
      } else {
        errorMessage = "Service Account does not have permission to access this spreadsheet. Make sure to share the spreadsheet with the service account email."
      }
    } else if (error.code === 404) {
      errorMessage = "Spreadsheet not found or invalid ID."
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        code: error.code,
        status: error.status,
        message: error.message
      }
    }, { status: 500 })
  }
}
