import { NextRequest, NextResponse } from 'next/server'
import { ZAI } from 'z-ai-web-dev-sdk'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const range = searchParams.get('range') || 'DiemDanh'

    try {
      const zai = await ZAI.create()
      
      // Fetch data from Google Sheets
      const reportData = await zai.functions.invoke('google_sheets_fetch', {
        spreadsheetId: '1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM',
        range: sessionId ? `Session_${sessionId}` : range,
        filters: {}
      })

      return NextResponse.json({
        success: true,
        data: {
          headers: reportData.headers || [],
          firstRow: reportData.rows?.[0] || [],
          totalRows: reportData.rows?.length || 0,
          sampleData: reportData.rows?.slice(0, 3) || [],
          fullStructure: reportData
        }
      })

    } catch (zaiError) {
      console.error('ZAI fetch error:', zaiError)
      
      return NextResponse.json(
        { error: 'Không thể kết nối đến Google Sheets', details: zaiError?.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Debug structure error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống', details: error?.message },
      { status: 500 }
    )
  }
}