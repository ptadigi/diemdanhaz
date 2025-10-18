import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/google-sheets'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const khoa = searchParams.get('khoa') || 'K15'
    const testName = searchParams.get('testName') || ''
    const testConnection = searchParams.get('testConnection') === 'true'

    const sheetsService = new GoogleSheetsService()

    // Test Google Sheets API connection if requested
    let connectionTest = null
    if (testConnection) {
      connectionTest = await sheetsService.testConnection()
      if (!connectionTest.success) {
        return NextResponse.json({
          success: false,
          message: 'Google Sheets API connection failed',
          connectionTest: connectionTest
        }, { status: 500 })
      }
    }

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
        spreadsheetId: '1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM',
        connectionTest: connectionTest
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, studentName, khoa } = body
    
    const sheetsService = new GoogleSheetsService()
    
    if (action === 'test-direct-write') {
      // Test direct write for a specific student
      const studentInfo = await sheetsService.findStudent(studentName || 'MOLOM QUỐC', '', '', khoa || 'K15')
      
      if (!studentInfo) {
        return NextResponse.json({
          success: false,
          message: 'Student not found'
        }, { status: 404 })
      }
      
      const todayColumn = await sheetsService.findTodayColumn(khoa || 'K15')
      
      if (!todayColumn) {
        return NextResponse.json({
          success: false,
          message: 'Today column not found'
        }, { status: 404 })
      }
      
      // Test writing TRUE
      const writeResult = await sheetsService.markAttendanceDirect(studentInfo, todayColumn)
      
      return NextResponse.json({
        success: writeResult.success,
        message: writeResult.message,
        studentInfo: {
          name: studentInfo.hoTen,
          row: studentInfo.row,
          khoa: studentInfo.khoa
        },
        column: todayColumn,
        writeResult: writeResult
      })
    }
    
    if (action === 'test-auto-write') {
      // Test auto write (find today column automatically)
      const studentInfo = await sheetsService.findStudent(studentName || 'MOLOM QUỐC', '', '', khoa || 'K15')
      
      if (!studentInfo) {
        return NextResponse.json({
          success: false,
          message: 'Student not found'
        }, { status: 404 })
      }
      
      // Test auto write
      const writeResult = await sheetsService.markAttendanceDirectAuto(studentInfo)
      
      return NextResponse.json({
        success: writeResult.success,
        message: writeResult.message,
        studentInfo: {
          name: studentInfo.hoTen,
          row: studentInfo.row,
          khoa: studentInfo.khoa
        },
        writeResult: writeResult
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action. Use "test-direct-write" or "test-auto-write"'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Google Sheets API POST test error:', error)
    return NextResponse.json({
      success: false,
      message: `❌ Google Sheets API POST test failed: ${(error as Error).message}`,
      error: (error as Error).stack
    }, { status: 500 })
  }
}