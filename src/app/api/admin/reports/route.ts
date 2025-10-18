import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { khoa, period } = await request.json()

    // Calculate date range based on period
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90days':
        startDate.setDate(startDate.getDate() - 90)
        break
      case 'all':
        startDate.setFullYear(startDate.getFullYear() - 10) // Very old date
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Fetch sessions with attendance data
    const sessions = await db.diemDanhSession.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        attendanceRecords: {
          where: khoa !== 'all' ? { khoa } : undefined
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    // Transform data for reports
    const reportsData: any[] = []
    const sessionMap = new Map()

    sessions.forEach(session => {
      const dateKey = session.startTime.toLocaleDateString('vi-VN')
      
      if (!sessionMap.has(dateKey)) {
        sessionMap.set(dateKey, {
          date: dateKey,
          totalStudents: 0,
          attendedStudents: 0,
          attendanceRate: 0,
          sessions: []
        })
      }

      const dayData = sessionMap.get(dateKey)
      const sessionAttendance = session.attendanceRecords.length
      const sessionPresent = session.attendanceRecords.filter(r => r.isPresent).length
      
      dayData.totalStudents += sessionAttendance
      dayData.attendedStudents += sessionPresent
      
      dayData.sessions.push({
        id: session.id,
        title: session.title,
        khoa: session.attendanceRecords.length > 0 ? 
          session.attendanceRecords[0].khoa : 'Chưa xác định',
        startTime: session.startTime.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        endTime: session.endTime.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        attendanceCode: session.sessionCode,
        attendedCount: sessionPresent,
        totalCount: sessionAttendance
      })
    })

    // Calculate attendance rates
    sessionMap.forEach(dayData => {
      dayData.attendanceRate = dayData.totalStudents > 0 ? 
        (dayData.attendedStudents / dayData.totalStudents) * 100 : 0
      reportsData.push(dayData)
    })

    // Fetch student attendance data
    const studentAttendanceMap = new Map()
    
    sessions.forEach(session => {
      session.attendanceRecords.forEach(record => {
        const studentKey = `${record.hoTen}-${record.khoa}`
        
        if (!studentAttendanceMap.has(studentKey)) {
          studentAttendanceMap.set(studentKey, {
            studentName: record.hoTen,
            khoa: record.khoa,
            totalSessions: 0,
            attendedSessions: 0,
            attendanceRate: 0,
            lastAttendance: ''
          })
        }
        
        const studentData = studentAttendanceMap.get(studentKey)
        studentData.totalSessions += 1
        if (record.isPresent) {
          studentData.attendedSessions += 1
          studentData.lastAttendance = session.startTime.toLocaleDateString('vi-VN')
        }
      })
    })

    // Calculate student attendance rates
    const studentAttendance = Array.from(studentAttendanceMap.values()).map(student => ({
      ...student,
      attendanceRate: student.totalSessions > 0 ? 
        (student.attendedSessions / student.totalSessions) * 100 : 0
    }))

    return NextResponse.json({
      success: true,
      reports: reportsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      studentAttendance: studentAttendance.sort((a, b) => b.attendanceRate - a.attendanceRate)
    })

  } catch (error) {
    console.error('Error generating reports:', error)
    return NextResponse.json(
      { error: 'Lỗi khi tạo báo cáo' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Get specific session report
      const session = await db.diemDanhSession.findUnique({
        where: { id: sessionId },
        include: {
          attendanceRecords: {
            orderBy: {
              diemDanhLuc: 'desc'
            }
          }
        }
      })

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        session: {
          ...session,
          attendanceRecords: session.attendanceRecords.map(record => ({
            ...record,
            diemDanhLuc: record.diemDanhLuc.toLocaleString('vi-VN')
          }))
        }
      })
    }

    // Get general overview
    const totalSessions = await db.diemDanhSession.count()
    const activeSessions = await db.diemDanhSession.count({ where: { isActive: true } })
    const totalAttendances = await db.diemDanhRecord.count()
    const presentAttendances = await db.diemDanhRecord.count({ where: { isPresent: true } })

    return NextResponse.json({
      success: true,
      overview: {
        totalSessions,
        activeSessions,
        totalAttendances,
        presentAttendances,
        attendanceRate: totalAttendances > 0 ? (presentAttendances / totalAttendances) * 100 : 0
      }
    })

  } catch (error) {
    console.error('Error getting reports:', error)
    return NextResponse.json(
      { error: 'Lỗi khi lấy báo cáo' },
      { status: 500 }
    )
  }
}