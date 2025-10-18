import { NextRequest, NextResponse } from 'next/server'
import { getGoogleSheetsService } from '@/lib/google-sheets'

export async function GET() {
  try {
    const googleSheets = getGoogleSheetsService()
    await googleSheets.initialize()
    
    // Test connection first
    const isConnected = await googleSheets.testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Không thể kết nối đến Google Sheets' },
        { status: 500 }
      )
    }
    
    // Get spreadsheet info
    const spreadsheetInfo = await googleSheets.getSpreadsheetInfo()
    
    // Extract khoa names from sheet titles
    const khoaList = spreadsheetInfo.sheets
      .map((sheet: any) => sheet.title)
      .filter((title: string) => title && (title.includes('K') || title.toLowerCase().includes('khoa')))
      .map((title: string) => {
        // Extract khoa number (K15, K16, etc.)
        const match = title.match(/K\d+/i)
        return match ? match[0].toUpperCase() : title
      })
      .filter((khoa: string, index: number, arr: string[]) => arr.indexOf(khoa) === index) // Remove duplicates
    
    // Sort by khoa number
    khoaList.sort((a: string, b: string) => {
      const numA = parseInt(a.replace(/\D/g, ''))
      const numB = parseInt(b.replace(/\D/g, ''))
      return numA - numB
    })
    
    return NextResponse.json({
      success: true,
      khoaList,
      spreadsheetInfo: {
        title: spreadsheetInfo.title,
        totalSheets: spreadsheetInfo.sheets.length
      }
    })
    
  } catch (error) {
    console.error('Error fetching khoa list:', error)
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách khóa học: ' + (error as Error).message },
      { status: 500 }
    )
  }
}