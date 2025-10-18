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

      // Process data to group by class (Khóa)
      const classStats = new Map()
      let totalStudents = 0
      let totalPresent = 0

      // Check if reportData has rows
      if (!reportData.rows || reportData.rows.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            summary: {
              totalStudents: 0,
              totalPresent: 0,
              totalAbsent: 0,
              totalClasses: 0,
              date: date || new Date().toLocaleDateString('vi-VN')
            },
            classStats: [],
            sessionId,
            fetchedAt: new Date().toISOString()
          }
        })
      }

      reportData.rows.forEach((row: string[]) => {
        const className = row[4] || 'Unknown' // Khóa is at index 4
        const status = row[7] || '' // Status is at index 7
        
        if (!classStats.has(className)) {
          classStats.set(className, {
            className,
            total: 0,
            present: 0,
            absent: 0,
            students: []
          })
        }

        const stats = classStats.get(className)
        const studentName = row[1] || ''
        const attendanceTime = row[6] || ''
        
        stats.total++
        totalStudents++
        
        if (status.includes('Đã điểm danh') || status.includes('Present')) {
          stats.present++
          totalPresent++
          stats.students.push({
            name: studentName,
            time: attendanceTime,
            status: 'present'
          })
        } else {
          stats.absent++
          stats.students.push({
            name: studentName,
            time: '',
            status: 'absent'
          })
        }
      })

      const classStatsArray = Array.from(classStats.values()).sort((a, b) => 
        a.className.localeCompare(b.className)
      )

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalStudents,
            totalPresent,
            totalAbsent: totalStudents - totalPresent,
            totalClasses: classStatsArray.length,
            date: date || new Date().toLocaleDateString('vi-VN')
          },
          classStats: classStatsArray,
          sessionId,
          fetchedAt: new Date().toISOString()
        }
      })

    } catch (zaiError) {
      console.error('ZAI fetch error:', zaiError)
      
      return NextResponse.json(
        { error: 'Không thể kết nối đến Google Sheets để lấy dữ liệu thống kê' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống, không thể lấy thống kê' },
      { status: 500 }
    )
  }
}