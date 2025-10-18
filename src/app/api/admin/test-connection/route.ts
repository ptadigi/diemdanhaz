import { NextRequest, NextResponse } from 'next/server'
import { getGoogleSheetsService } from '@/lib/google-sheets'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Testing Google Sheets API connection...')
    
    // Initialize Google Sheets service
    const sheetsService = getGoogleSheetsService()
    await sheetsService.initialize()
    
    // Test basic connection
    const isConnected = await sheetsService.testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Không thể kết nối đến Google Sheets. Kiểm tra lại Service Account permissions.'
        },
        { status: 500 }
      )
    }
    
    // Get spreadsheet info
    const spreadsheetInfo = await sheetsService.getSpreadsheetInfo()
    
    // Test reading data from K15 sheet
    let k15Students = []
    try {
      k15Students = await sheetsService.getStudentsByKhoa('K15')
    } catch (error) {
      console.warn('⚠️ Could not read K15 data:', error)
    }
    
    // Test reading data from K16 sheet
    let k16Students = []
    try {
      k16Students = await sheetsService.getStudentsByKhoa('K16')
    } catch (error) {
      console.warn('⚠️ Could not read K16 data:', error)
    }

    return NextResponse.json({
      success: true,
      message: '✅ Kết nối Google Sheets API thành công!',
      data: {
        spreadsheetInfo,
        k15Data: {
          totalStudents: k15Students.length,
          sampleStudents: k15Students.slice(0, 3).map(s => ({
            name: s.hoTen,
            cccd: s.cccd,
            khoa: s.khoa
          }))
        },
        k16Data: {
          totalStudents: k16Students.length,
          sampleStudents: k16Students.slice(0, 3).map(s => ({
            name: s.hoTen,
            cccd: s.cccd,
            khoa: s.khoa
          }))
        },
        connectionTime: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Google Sheets connection test failed:', error)
    
    let errorMessage = 'Lỗi kết nối Google Sheets API'
    
    if (error.message?.includes('ENOTFOUND')) {
      errorMessage = 'Lỗi mạng: Không thể kết nối đến Google APIs'
    } else if (error.message?.includes('403')) {
      errorMessage = 'Lỗi quyền truy cập: Service Account cần được chia sẻ spreadsheet với quyền Viewer/Editor'
    } else if (error.message?.includes('404')) {
      errorMessage = 'Lỗi: Spreadsheet ID không tồn tại hoặc không có quyền truy cập'
    } else if (error.message) {
      errorMessage = `Lỗi: ${error.message}`
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Check configuration
    const config = {
      hasSpreadsheetId: !!process.env.GOOGLE_SPREADSHEET_ID,
      hasServiceAccountEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    }

    if (!config.hasSpreadsheetId || !config.hasServiceAccountEmail || !config.hasPrivateKey) {
      return NextResponse.json({
        success: false,
        error: 'Thiếu cấu hình Google Sheets API',
        config
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Google Sheets API configuration found',
      config
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Configuration check failed: ' + (error as Error).message
      },
      { status: 500 }
    )
  }
}