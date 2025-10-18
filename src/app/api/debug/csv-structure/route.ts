import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/google-sheets'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const khoa = searchParams.get('khoa') || 'K15'

    const googleSheets = new GoogleSheetsService()
    
    // Lấy dữ liệu từ sheet
    const rows = await googleSheets.getPublicSheetData(khoa)
    
    // Lấy các cột ngày
    const dateColumns = await googleSheets.getDateColumns(khoa)
    
    // Tìm cột hôm nay
    const todayColumn = await googleSheets.findTodayColumn(khoa)
    
    return NextResponse.json({
      success: true,
      data: {
        khoa,
        totalRows: rows.length,
        headers: rows[0] || [],
        firstDataRow: rows[1] || [],
        sampleData: rows.slice(0, 5),
        dateColumns,
        todayColumn,
        allDateColumns: dateColumns.map(col => ({
          index: col.columnIndex,
          header: col.dateHeader,
          isToday: todayColumn?.columnIndex === col.columnIndex
        }))
      }
    })

  } catch (error) {
    console.error('Debug CSV structure error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống', details: error?.message },
      { status: 500 }
    )
  }
}