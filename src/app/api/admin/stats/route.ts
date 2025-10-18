import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/google-sheets'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionToken = request.cookies.get('admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sheetsService = new GoogleSheetsService()
    
    // Get students from both K15 and K16
    const k15Students = await sheetsService.getStudents('K15')
    const k16Students = await sheetsService.getStudents('K16')
    const totalStudents = k15Students.length + k16Students.length
    
    // Get today's column for both classes
    const k15TodayColumn = await sheetsService.findTodayColumn('K15')
    const k16TodayColumn = await sheetsService.findTodayColumn('K16')
    
    let todayAttendance = 0
    
    // Count attendance for K15
    if (k15TodayColumn) {
      for (const student of k15Students) {
        const hasAttended = await sheetsService.checkAttendanceStatusForDate(student, k15TodayColumn.columnIndex)
        if (hasAttended) todayAttendance++
      }
    }
    
    // Count attendance for K16
    if (k16TodayColumn) {
      for (const student of k16Students) {
        const hasAttended = await sheetsService.checkAttendanceStatusForDate(student, k16TodayColumn.columnIndex)
        if (hasAttended) todayAttendance++
      }
    }

    // Check if attendance window is active
    const now = new Date()
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
    const currentMinutes = vietnamTime.getHours() * 60 + vietnamTime.getMinutes()
    
    let settings = {
      startHour: 19,
      startMinute: 10,
      endHour: 19,
      endMinute: 30,
      isActive: true
    }
    
    try {
      const settingsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/settings`)
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        if (settingsData.success) {
          settings = settingsData.settings
        }
      }
    } catch (error) {
      console.log('Failed to fetch settings, using defaults')
    }
    
    const startMinutes = settings.startHour * 60 + settings.startMinute
    const endMinutes = settings.endHour * 60 + settings.endMinute
    const activeSession = settings.isActive && currentMinutes >= startMinutes && currentMinutes <= endMinutes

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        todayAttendance,
        activeSession,
        lastSync: new Date().toLocaleTimeString('vi-VN')
      }
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống, không thể lấy thống kê' },
      { status: 500 }
    )
  }
}