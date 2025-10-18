import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/google-sheets'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const khoa = searchParams.get('khoa') || 'K15'
    
    const googleSheets = new GoogleSheetsService()
    
    // Lấy toàn bộ dữ liệu từ sheet
    const allRows = await googleSheets.getPublicSheetData(khoa)
    
    // Lấy các cột ngày
    const dateColumns = await googleSheets.getDateColumns(khoa)
    
    // Phân tích dữ liệu chi tiết
    const analysis = {
      khoa,
      totalRows: allRows.length,
      dateColumns: dateColumns.map(col => ({
        columnIndex: col.columnIndex,
        dateHeader: col.dateHeader,
        sampleData: []
      })),
      sampleRows: [],
      attendanceAnalysis: []
    }
    
    // Lấy mẫu 5 hàng đầu tiên (không tính header)
    for (let i = 0; i < Math.min(6, allRows.length); i++) {
      analysis.sampleRows.push({
        rowIndex: i,
        data: allRows[i],
        hasData: allRows[i] && allRows[i].length > 0
      })
    }
    
    // Phân tích dữ liệu điểm danh cho mỗi cột ngày
    for (const dateCol of dateColumns) {
      const colAnalysis = {
        dateHeader: dateCol.dateHeader,
        columnIndex: dateCol.columnIndex,
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        emptyCount: 0,
        sampleValues: []
      }
      
      // Duyệt qua các hàng học viên (bỏ header)
      for (let i = 1; i < allRows.length; i++) {
        const row = allRows[i]
        if (!row || row.length === 0) continue
        
        const studentName = row[2] || '' // Họ và tên
        const attendanceValue = row[dateCol.columnIndex - 1] || ''
        
        if (studentName.trim()) {
          colAnalysis.totalStudents++
          
          if (attendanceValue.toUpperCase() === 'TRUE') {
            colAnalysis.presentCount++
          } else if (attendanceValue.toUpperCase() === 'FALSE') {
            colAnalysis.absentCount++
          } else if (attendanceValue.trim() === '') {
            colAnalysis.emptyCount++
          }
          
          // Lấy mẫu giá trị
          if (colAnalysis.sampleValues.length < 3) {
            colAnalysis.sampleValues.push({
              studentName: studentName.trim(),
              value: attendanceValue,
              rawValue: `"${attendanceValue}"`
            })
          }
        }
      }
      
      analysis.attendanceAnalysis.push(colAnalysis)
    }
    
    return NextResponse.json({
      success: true,
      data: analysis,
      debugInfo: {
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Debug sheets data error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Lỗi khi debug dữ liệu sheets',
        details: error?.message 
      },
      { status: 500 }
    )
  }
}