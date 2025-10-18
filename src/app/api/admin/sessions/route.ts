import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { title, khoa, duration = 20 } = await request.json()
    
    if (!title || !khoa) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tiêu đề và khóa học' },
        { status: 400 }
      )
    }
    
    // Tự động tạo title nếu không có
    const sessionTitle = title || `Phiên điểm danh ${new Date().toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })}`

    const now = new Date()
    const endTime = new Date(now.getTime() + duration * 60 * 1000)

    // Đóng tất cả các phiên đang hoạt động trước đó
    try {
      await db.diemDanhSession.updateMany({
        where: {
          isActive: true
        },
        data: {
          isActive: false,
          endTime: now
        }
      })
      console.log('✅ Đã đóng tất cả các phiên đang hoạt động trước đó')
    } catch (updateError) {
      console.error('Lỗi khi đóng các phiên cũ:', updateError)
    }

    // Create session in database
    const session = await db.diemDanhSession.create({
      data: {
        sessionCode: Math.floor(100000 + Math.random() * 900000).toString(),
        title: sessionTitle,
        khoa: khoa, // Lưu trường khoa
        startTime: now,
        endTime,
        isActive: true,
        spreadsheetId: '1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM',
        syncStatus: 'pending'
      }
    })

    // Send to webhook with session info
    try {
      const webhookData = {
        action: 'session_created',
        sessionCode: session.sessionCode,
        title: sessionTitle,
        khoa: khoa,
        startTime: now.toLocaleString('vi-VN'),
        endTime: endTime.toLocaleString('vi-VN'),
        duration: `${duration} phút`,
        date: now.toLocaleDateString('vi-VN'),
        sessionId: session.id,
        spreadsheetId: '1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM'
      }

      await fetch('https://n8n.phamthanh.net/webhook/diemdanh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      })
      
      // Auto-sync from Google Sheets after creating session
      console.log('🔄 Auto-syncing from Google Sheets...')
      try {
        const syncResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session.id,
            direction: 'from-google-sheets'
          }),
        })
        
        const syncResult = await syncResponse.json()
        if (syncResult.success) {
          console.log(`✅ Auto-synced ${syncResult.syncedCount} records from Google Sheets`)
        } else {
          console.error('❌ Auto-sync failed:', syncResult.error)
        }
      } catch (syncError) {
        console.error('❌ Auto-sync error:', syncError)
      }
      
    } catch (webhookError) {
      console.error('Webhook error:', webhookError)
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        khoa: khoa,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        date: session.startTime.toLocaleDateString('vi-VN'),
        isActive: session.isActive,
        attendanceCode: session.sessionCode,
        totalStudents: 0, // Will be updated when students attend
        attendedCount: 0
      }
    })

  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const sessions = await db.diemDanhSession.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Lấy 10 phiên gần nhất
    })

    // Đảm bảo chỉ có một phiên đang hoạt động
    const activeSessions = sessions.filter(s => s.isActive)
    if (activeSessions.length > 1) {
      // Nếu có nhiều phiên đang hoạt động, chỉ giữ phiên mới nhất
      const newestActive = activeSessions[0]
      const othersToDeactivate = activeSessions.slice(1)
      
      // Đóng các phiên cũ hơn trong database
      try {
        await db.diemDanhSession.updateMany({
          where: {
            id: {
              in: othersToDeactivate.map(s => s.id)
            }
          },
          data: {
            isActive: false
          }
        })
        console.log(`✅ Đã đóng ${othersToDeactivate.length} phiên hoạt động cũ`)
      } catch (error) {
        console.error('Lỗi khi đóng các phiên hoạt động cũ:', error)
      }
      
      // Cập nhật lại sessions để trả về
      sessions.forEach(s => {
        if (othersToDeactivate.some(old => old.id === s.id)) {
          s.isActive = false
        }
      })
    }

    // Transform data to match frontend expectations
    const transformedSessions = sessions.map(session => {
      // Get unique khoa from attendance records for this session, or use session.khoa
      const uniqueKhoas = [...new Set(session.attendanceRecords.map(r => r.khoa).filter(Boolean))]
      const primaryKhoa = session.khoa || (uniqueKhoas.length > 0 ? uniqueKhoas[0] : 'Chưa xác định')
      
      return {
        id: session.id,
        sessionCode: session.sessionCode, // Thêm sessionCode
        title: session.title,
        khoa: primaryKhoa,
        startTime: session.startTime.toISOString(), // Đổi sang ISO string
        endTime: session.endTime.toISOString(),   // Đổi sang ISO string
        date: session.startTime.toLocaleDateString('vi-VN'),
        isActive: session.isActive,
        attendanceCode: session.sessionCode,
        attendanceCount: session.attendanceRecords.length, // Thêm attendanceCount
        presentCount: session.attendanceRecords.filter(r => r.isPresent).length,
        totalStudents: session.attendanceRecords.length, // Giữ lại để tương thích
        attendedCount: session.attendanceRecords.filter(r => r.isPresent).length, // Giữ lại để tương thích
        attendanceRecords: session.attendanceRecords
      }
    })

    return NextResponse.json({
      success: true,
      sessions: transformedSessions
    })

  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}