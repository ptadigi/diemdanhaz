import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { GoogleSheetsService } from '@/lib/google-sheets'

interface AttendanceRequest {
  cccd: string
  hoTen: string
  soDienThoai: string
  khoa: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AttendanceRequest = await request.json()
    const { cccd, hoTen, soDienThoai, khoa } = body

    // Validate input
    if (!cccd || !hoTen || !soDienThoai || !khoa) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      )
    }

    // Check attendance time window using dynamic settings
    const now = new Date()
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
    const currentMinutes = vietnamTime.getHours() * 60 + vietnamTime.getMinutes()
    
    // Get current settings
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

    if (!settings.isActive || currentMinutes < startMinutes || currentMinutes > endMinutes) {
      return NextResponse.json(
        { 
          error: `Ngoài khung giờ điểm danh (${settings.startHour.toString().padStart(2, '0')}:${settings.startMinute.toString().padStart(2, '0')}-${settings.endHour.toString().padStart(2, '0')}:${settings.endMinute.toString().padStart(2, '0')})` 
        },
        { status: 403 }
      )
    }

    // Initialize Google Sheets service
    const sheetsService = new GoogleSheetsService()

    // Find student in Google Sheet
    const studentInfo = await sheetsService.findStudent(hoTen, cccd, soDienThoai, khoa)
    
    if (!studentInfo) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin học viên. Vui lòng kiểm tra lại tên, CCCD hoặc số điện thoại.' },
        { status: 404 }
      )
    }

    // Check if already marked attendance
    const alreadyMarked = await sheetsService.checkAttendanceStatus(studentInfo)
    if (alreadyMarked) {
      return NextResponse.json(
        { error: 'Bạn đã điểm danh hôm nay rồi!' },
        { status: 409 }
      )
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Mark attendance on Google Sheet using direct API
    const markResult = await sheetsService.markAttendanceDirectAuto(studentInfo)
    
    if (!markResult.success) {
      return NextResponse.json(
        { error: markResult.message || 'Lỗi khi đánh dấu điểm danh trên Google Sheet' },
        { status: 500 }
      )
    }

    console.log('✅ Direct Google Sheets update successful:', markResult.message)

    // Prepare webhook data with detailed information for n8n to process
    const webhookData = {
      action: 'mark_attendance',
      code: code,
      cccd: cccd,
      hoTen: hoTen,
      soDienThoai: soDienThoai,
      khoa: khoa,
      thoiGianDiemDanh: now.toISOString(),
      ngayDiemDanh: now.toLocaleDateString('vi-VN'),
      gioDiemDanh: now.toLocaleTimeString('vi-VN'),
      studentFound: studentInfo.hoTen,
      sheetRow: studentInfo.row,
      spreadsheetId: '1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM',
      sheetName: khoa === 'K15' ? 'K15' : 'K16',
      todayColumn: (await sheetsService.findTodayColumn(khoa))?.dateHeader || '',
      markValue: `X (${code})`,
      attendanceData: {
        row: studentInfo.row,
        column: (await sheetsService.findTodayColumn(khoa))?.columnIndex || 0,
        value: `X (${code})`
      }
    }

    // Send to webhook
    try {
      const webhookResponse = await fetch('https://n8n.phamthanh.net/webhook/diemdanh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      })

      if (!webhookResponse.ok) {
        console.error('Webhook failed:', webhookResponse.statusText)
      }
    } catch (webhookError) {
      console.error('Webhook error:', webhookError)
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Điểm danh thành công! Đã ghi trực tiếp vào Google Sheet cho ${studentInfo.hoTen}`,
      code: code,
      data: {
        hoTen: studentInfo.hoTen,
        khoa: khoa,
        thoiGian: now.toLocaleString('vi-VN'),
        sheetRow: studentInfo.row,
        googleSheetsMarked: true,
        directUpdate: true
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

export async function GET() {
  return NextResponse.json({
    message: 'API điểm danh đang hoạt động',
    time: new Date().toISOString()
  })
}