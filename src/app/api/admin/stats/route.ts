import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get today's date in Vietnam timezone
    const today = new Date()
    const vietnamToday = new Date(today.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
    const todayStart = new Date(vietnamToday.getFullYear(), vietnamToday.getMonth(), vietnamToday.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    // Get total students from attendance records (unique students)
    const totalStudentsResult = await db.diemDanhRecord.groupBy({
      by: ['hoTen', 'khoa'],
      _count: {
        id: true
      }
    })
    const totalStudents = totalStudentsResult.length

    // Get today's attendance
    const todayAttendances = await db.diemDanhRecord.findMany({
      where: {
        diemDanhLuc: {
          gte: todayStart,
          lt: todayEnd
        },
        isPresent: true
      }
    })

    // Get unique students who attended today
    const uniqueTodayAttendees = new Set(
      todayAttendances.map(record => `${record.hoTen}-${record.khoa}`)
    )
    const todayAttendance = uniqueTodayAttendees.size

    // Check if there's an active session
    const activeSession = await db.diemDanhSession.findFirst({
      where: {
        isActive: true,
        startTime: {
          lte: vietnamToday
        },
        endTime: {
          gte: vietnamToday
        }
      }
    })

    // Get last sync time (most recent attendance record or session creation)
    const lastAttendance = await db.diemDanhRecord.findFirst({
      orderBy: {
        diemDanhLuc: 'desc'
      }
    })

    const lastSession = await db.diemDanhSession.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    })

    const lastSync = lastAttendance?.diemDanhLuc || lastSession?.createdAt || null

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        todayAttendance,
        activeSession: !!activeSession,
        lastSync: lastSync ? lastSync.toLocaleTimeString('vi-VN') : 'Chưa có'
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