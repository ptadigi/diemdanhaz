import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/google-sheets'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const khoa = searchParams.get('khoa') || 'K15'
    const testName = searchParams.get('testName') || ''

    const sheetsService = new GoogleSheetsService()

    // Test getting students
    const students = await sheetsService.getStudents(khoa)
    
    // Test finding student
    let foundStudent = null
    if (testName) {
      foundStudent = await sheetsService.findStudent(testName, '', '', khoa)
    }

    // Test getting date columns
    const dateColumns = await sheetsService.getDateColumns(khoa)
    
    // Test finding today column
    const todayColumn = await sheetsService.findTodayColumn(khoa)

    return NextResponse.json({
      success: true,
      data: {
        khoa: khoa,
        totalStudents: students.length,
        students: students.slice(0, 5), // Only show first 5 for demo
        foundStudent: foundStudent,
        dateColumns: dateColumns,
        todayColumn: todayColumn,
        spreadsheetId: '1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM'
      }
    })

  } catch (error) {
    console.error('Test Google Sheets error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Lỗi khi kết nối Google Sheets. Kiểm tra lại link và quyền truy cập.'
      },
      { status: 500 }
    )
  }
}