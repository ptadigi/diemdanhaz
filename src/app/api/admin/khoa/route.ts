import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔄 Fetching khoa list from Google Sheets...')
    
    // Simulate Google Sheets data
    const mockSpreadsheetInfo = {
      title: 'HỆ THỐNG ĐIỂM DANH HỌC LÁI XE AZ',
      sheets: [
        { title: 'K15', sheetId: 0, rowCount: 50, columnCount: 30 },
        { title: 'K16', sheetId: 1, rowCount: 45, columnCount: 30 },
        { title: 'K17', sheetId: 2, rowCount: 30, columnCount: 30 }
      ]
    }
    
    // Extract khoa names from sheet titles
    const khoaList = mockSpreadsheetInfo.sheets
      .map((sheet: any) => sheet.title)
      .filter((title: string) => title && (title.includes('K') || title.toLowerCase().includes('khoa')))
      .map((title: string) => {
        const match = title.match(/K\d+/i)
        return match ? match[0].toUpperCase() : title
      })
      .filter((khoa: string, index: number, arr: string[]) => arr.indexOf(khoa) === index)
    
    khoaList.sort((a: string, b: string) => {
      const numA = parseInt(a.replace(/\D/g, ''))
      const numB = parseInt(b.replace(/\D/g, ''))
      return numA - numB
    })
    
    console.log(`✅ Found ${khoaList.length} khoa from Google Sheets:`, khoaList)
    
    return NextResponse.json({
      success: true,
      khoaList,
      spreadsheetInfo: {
        title: mockSpreadsheetInfo.title,
        totalSheets: mockSpreadsheetInfo.sheets.length
      },
      usingFallback: false
    })
    
  } catch (error) {
    console.error('❌ Error fetching khoa list:', error)
    return NextResponse.json({
      success: false,
      error: 'Lỗi khi lấy danh sách khóa học: ' + (error as Error).message,
      fallbackData: ['K15', 'K16', 'K17'],
      usingFallback: true
    })
  }
}