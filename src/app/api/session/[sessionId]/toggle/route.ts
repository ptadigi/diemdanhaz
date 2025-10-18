import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    // Find the session
    const session = await db.diemDanhSession.findUnique({
      where: { id: sessionId },
      include: {
        attendanceRecords: {
          select: {
            id: true,
            hoTen: true,
            khoa: true,
            diemDanhLuc: true,
            isPresent: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Toggle session status
    const updatedSession = await db.diemDanhSession.update({
      where: { id: sessionId },
      data: {
        isActive: !session.isActive,
        endTime: !session.isActive ? new Date() : session.endTime
      }
    })

    // Get unique khoa from attendance records
    const uniqueKhoas = [...new Set(session.attendanceRecords.map(r => r.khoa).filter(Boolean))]
    const primaryKhoa = uniqueKhoas.length > 0 ? uniqueKhoas[0] : 'Chưa xác định'

    // Return transformed session data
    const transformedSession = {
      id: updatedSession.id,
      title: updatedSession.title,
      khoa: primaryKhoa,
      startTime: updatedSession.startTime.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      endTime: updatedSession.endTime.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      date: updatedSession.startTime.toLocaleDateString('vi-VN'),
      isActive: updatedSession.isActive,
      attendanceCode: updatedSession.sessionCode,
      totalStudents: session.attendanceRecords.length,
      attendedCount: session.attendanceRecords.filter(r => r.isPresent).length
    }

    return NextResponse.json({
      success: true,
      session: transformedSession
    })
  } catch (error) {
    console.error('Error toggling session:', error)
    return NextResponse.json(
      { error: 'Failed to toggle session' },
      { status: 500 }
    )
  }
}