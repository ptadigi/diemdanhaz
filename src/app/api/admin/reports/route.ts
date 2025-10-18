import { NextRequest, NextResponse } from 'next/server'
import { ZAI } from 'z-ai-web-dev-sdk'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const date = searchParams.get('date')

    try {
      const zai = await ZAI.create()
      
      // Fetch data from Google Sheets
      const reportData = await zai.functions.invoke('google_sheets_fetch', {
        spreadsheetId: '1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM',
        range: sessionId ? `Session_${sessionId}` : 'DiemDanh',
        filters: date ? { date } : {}
      })

      // Check if reportData has valid structure
      if (!reportData || !reportData.headers || !reportData.rows) {
        return NextResponse.json({
          success: true,
          data: {
            headers: ['STT', 'Họ và Tên', 'CCCD', 'Số Điện Thoại', 'Khóa', 'Ngày Sinh', 'Thời Gian Điểm Danh', 'Trạng Thái'],
            rows: [],
            summary: {
              total: 0,
              present: 0,
              absent: 0,
              date: date || new Date().toLocaleDateString('vi-VN')
            }
          }
        })
      }

      return NextResponse.json({
        success: true,
        data: reportData,
        fetchedAt: new Date().toISOString()
      })

    } catch (zaiError) {
      console.error('ZAI fetch error:', zaiError)
      
      return NextResponse.json(
        { error: 'Không thể kết nối đến Google Sheets để lấy dữ liệu báo cáo' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống, không thể lấy báo cáo' },
      { status: 500 }
    )
  }
}