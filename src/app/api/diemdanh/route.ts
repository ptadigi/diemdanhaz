import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { attendanceCode, studentInfo } = await request.json()
    
    if (!attendanceCode || !studentInfo) {
      return NextResponse.json(
        { error: 'Vui lòng nhập mã điểm danh và thông tin học viên' },
        { status: 400 }
      )
    }

    // Find active session with this attendance code
    const session = await db.diemDanhSession.findFirst({
      where: {
        sessionCode: attendanceCode,
        isActive: true,
        endTime: {
          gt: new Date()
        }
      },
      include: {
        attendanceRecords: true
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Mã điểm danh không hợp lệ hoặc phiên đã hết hạn' },
        { status: 404 }
      )
    }

    // Check if student already attended this session
    const existingRecord = await db.diemDanhRecord.findFirst({
      where: {
        sessionId: session.id,
        cccd: studentInfo.cccd,
        hoTen: studentInfo.hoTen
      }
    })

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Bạn đã điểm danh cho phiên này rồi' },
        { status: 409 }
      )
    }

    // Create attendance record
    const attendanceRecord = await db.diemDanhRecord.create({
      data: {
        sessionId: session.id,
        hoTen: studentInfo.hoTen,
        cccd: studentInfo.cccd,
        soDienThoai: studentInfo.soDienThoai,
        khoa: studentInfo.khoa,
        ngaySinh: studentInfo.ngaySinh,
        ghiChu: studentInfo.ghiChu,
        isPresent: true,
        diemDanhLuc: new Date(),
        syncStatus: 'pending' // Mark for sync to Google Sheets
      }
    })

    // Send to webhook
    try {
      const webhookData = {
        action: 'student_attended',
        sessionId: session.id,
        sessionCode: attendanceCode,
        studentInfo: studentInfo,
        attendanceTime: new Date().toLocaleString('vi-VN'),
        spreadsheetId: session.spreadsheetId
      }

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

    // Trigger async sync to Google Sheets
    setTimeout(async () => {
      try {
        const syncResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session.id,
            direction: 'to-google-sheets'
          }),
        })
        
        const syncResult = await syncResponse.json()
        if (syncResult.success) {
          console.log(`✅ Synced attendance to Google Sheets for ${studentInfo.hoTen}`)
          
          // Update record sync status
          await db.diemDanhRecord.update({
            where: { id: attendanceRecord.id },
            data: {
              syncStatus: 'synced',
              lastSyncAt: new Date()
            }
          })
        } else {
          console.error('❌ Sync to Google Sheets failed:', syncResult.error)
          
          // Update record sync status to error
          await db.diemDanhRecord.update({
            where: { id: attendanceRecord.id },
            data: {
              syncStatus: 'error',
              lastSyncAt: new Date()
            }
          })
        }
      } catch (syncError) {
        console.error('❌ Sync error:', syncError)
        
        // Update record sync status to error
        await db.diemDanhRecord.update({
          where: { id: attendanceRecord.id },
          data: {
            syncStatus: 'error',
            lastSyncAt: new Date()
          }
        })
      }
    }, 1000) // Delay 1 second to avoid race conditions

    return NextResponse.json({
      success: true,
      message: 'Điểm danh thành công!',
      data: {
        sessionId: session.id,
        sessionTitle: session.title,
        studentName: studentInfo.hoTen,
        attendanceTime: attendanceRecord.diemDanhLuc,
        khoa: studentInfo.khoa
      }
    })

  } catch (error) {
    console.error('Attendance error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const attendanceCode = searchParams.get('code')
    
    if (!attendanceCode) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp mã điểm danh' },
        { status: 400 }
      )
    }

    // Find session with this attendance code
    const session = await db.diemDanhSession.findFirst({
      where: {
        sessionCode: attendanceCode,
        isActive: true,
        endTime: {
          gt: new Date()
        }
      },
      include: {
        attendanceRecords: {
          where: {
            isPresent: true
          },
          select: {
            id: true,
            hoTen: true,
            khoa: true,
            diemDanhLuc: true
          },
          orderBy: {
            diemDanhLuc: 'desc'
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Mã điểm danh không hợp lệ hoặc phiên đã hết hạn' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        khoa: session.khoa,
        startTime: session.startTime,
        endTime: session.endTime,
        attendanceCode: session.sessionCode,
        totalAttended: session.attendanceRecords.length,
        recentAttendees: session.attendanceRecords.slice(0, 10) // Last 10 attendees
      }
    })

  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}