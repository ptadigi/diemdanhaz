import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ZAI } from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { title, duration = 20 } = await request.json()
    
    // Tự động tạo title nếu không có
    const sessionTitle = title || `Phiên điểm danh ${new Date().toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })}`

    const now = new Date()
    const endTime = new Date(now.getTime() + duration * 60 * 1000)

    // ĐẶT QUAN TRỌNG: Đóng tất cả các phiên đang hoạt động trước đó
    try {
      await db.diemDanhSession.updateMany({
        where: {
          isActive: true
        },
        data: {
          isActive: false
        }
      })
      console.log('✅ Đã đóng tất cả các phiên đang hoạt động trước đó')
    } catch (updateError) {
      console.error('Lỗi khi đóng các phiên cũ:', updateError)
      // Vẫn tiếp tục tạo phiên mới ngay cả khi không đóng được phiên cũ
    }

    // Create session in database
    const session = await db.diemDanhSession.create({
      data: {
        sessionCode: Math.floor(100000 + Math.random() * 900000).toString(),
        title: sessionTitle,
        startTime: now,
        endTime,
        isActive: true
      }
    })

    // Send to webhook with session info
    try {
      const webhookData = {
        action: 'session_created',
        sessionCode,
        title: sessionTitle,
        startTime: now.toLocaleString('vi-VN'),
        endTime: endTime.toLocaleString('vi-VN'),
        duration: `${duration} phút`,
        date: now.toLocaleDateString('vi-VN'),
        sessionId: session.id,
        spreadsheetId: '1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM'
      }

      // Gửi webhook thông báo phiên mới
      await fetch('https://n8n.phamthanh.net/webhook/diemdanh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      })
      
    } catch (webhookError) {
      console.error('Webhook error:', webhookError)
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        sessionCode: session.sessionCode,
        title: session.title,
        startTime: session.startTime,
        endTime: session.endTime,
        isActive: session.isActive
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

    return NextResponse.json({
      success: true,
      sessions: sessions.map(session => ({
        ...session,
        attendanceCount: session.attendanceRecords.length,
        presentCount: session.attendanceRecords.filter(r => r.isPresent).length
      }))
    })

  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}