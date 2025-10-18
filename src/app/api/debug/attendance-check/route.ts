import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/google-sheets'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const khoa = searchParams.get('khoa') || 'K15'

    const googleSheets = new GoogleSheetsService()
    
    // Lấy các cột ngày
    const dateColumns = await googleSheets.getDateColumns(khoa)
    
    // Tìm cột ngày gần nhất
    let targetColumn = null
    if (dateColumns.length > 0) {
      const today = new Date()
      let closestColumn = dateColumns[0]
      let minDiff = Infinity

      dateColumns.forEach(col => {
        const colDate = new Date(col.dateHeader.split('/').reverse().join('-'))
        const diff = Math.abs(colDate.getTime() - today.getTime())
        if (diff < minDiff) {
          minDiff = diff
          closestColumn = col
        }
      })

      targetColumn = closestColumn
    }

    if (!targetColumn) {
      return NextResponse.json({
        success: false,
        error: 'No date column found'
      })
    }

    // Lấy toàn bộ dữ liệu
    const allRows = await googleSheets.getPublicSheetData(khoa)
    
    // Kiểm tra 5 hàng đầu tiên
    const sampleRows = []
    for (let i = 1; i < Math.min(6, allRows.length); i++) {
      const row = allRows[i]
      if (row && row.length > 0) {
        const studentName = row[2] || ''
        const attendanceValue = row[targetColumn.columnIndex - 1] || ''
        
        sampleRows.push({
          rowIndex: i,
          studentName,
          attendanceValue,
          columnIndex: targetColumn.columnIndex,
          dateHeader: targetColumn.dateHeader,
          isPresent: attendanceValue.toUpperCase() === 'TRUE' || 
                     attendanceValue.toLowerCase() === 'có' ||
                     attendanceValue.toLowerCase() === 'x' ||
                     (attendanceValue.trim() !== '' && attendanceValue.toUpperCase() !== 'FALSE')
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        khoa,
        targetColumn,
        totalRows: allRows.length,
        sampleRows,
        dateColumns: dateColumns.slice(0, 5) // First 5 date columns
      }
    })

  } catch (error) {
    console.error('Debug attendance check error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống', details: error?.message },
      { status: 500 }
    )
  }
}