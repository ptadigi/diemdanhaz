import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/google-sheets'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface ConfirmRequest {
  studentInfo: {
    row: number
    stt: string
    ngayDk: string
    hoTen: string
    ngaySinh: string
    cccd?: string
    soDienThoai?: string
    hang?: string
    tinhTrang?: string
    khuVuc?: string
    khoa: string
  }
  code: string
  formData: {
    cccd: string
    hoTen: string
    soDienThoai: string
    khoa: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmRequest = await request.json()
    const { studentInfo, code, formData } = body

    // Validate input
    if (!studentInfo || !code || !formData) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ' },
        { status: 400 }
      )
    }

    // Check attendance time window using settings
    const now = new Date()
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
    const currentMinutes = vietnamTime.getHours() * 60 + vietnamTime.getMinutes()
    
    // Get settings from file or database
    let startHour = 19, startMinute = 10, endHour = 19, endMinute = 30, isActive = true
    
    try {
      const settingsPath = join(process.cwd(), 'data', 'settings.json')
      
      if (existsSync(settingsPath)) {
        const settingsData = JSON.parse(readFileSync(settingsPath, 'utf8'))
        startHour = settingsData.startHour || 19
        startMinute = settingsData.startMinute || 10
        endHour = settingsData.endHour || 19
        endMinute = settingsData.endMinute || 30
        isActive = settingsData.isActive !== false
      }
    } catch (error) {
      console.log('Using default settings')
    }
    
    if (!isActive) {
      return NextResponse.json(
        { error: 'Hệ thống điểm danh đã tắt' },
        { status: 403 }
      )
    }
    
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      return NextResponse.json(
        { error: `Ngoài khung giờ điểm danh (${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')})` },
        { status: 403 }
      )
    }

    // Initialize Google Sheets service
    const sheetsService = new GoogleSheetsService()

    // Mark attendance on Google Sheet with TRUE
    const markResult = await sheetsService.markAttendance(studentInfo, code)
    
    if (!markResult.success) {
      return NextResponse.json(
        { error: markResult.message || 'Lỗi khi đánh dấu điểm danh trên Google Sheet' },
        { status: 500 }
      )
    }

    // Prepare webhook data with detailed information for n8n to process
    const webhookData = {
      action: 'mark_attendance',
      code: code,
      cccd: formData.cccd,
      hoTen: formData.hoTen,
      soDienThoai: formData.soDienThoai,
      khoa: formData.khoa,
      thoiGianDiemDanh: now.toISOString(),
      ngayDiemDanh: now.toLocaleDateString('vi-VN'),
      gioDiemDanh: now.toLocaleTimeString('vi-VN'),
      studentFound: studentInfo.hoTen,
      sheetRow: studentInfo.row,
      spreadsheetId: '1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM',
      sheetName: formData.khoa === 'K15' ? 'K15' : 'K16',
      todayColumn: (await sheetsService.findTodayColumn(formData.khoa))?.dateHeader || '',
      markValue: 'TRUE', // Đánh dấu TRUE thay vì X(mã)
      attendanceData: {
        row: studentInfo.row,
        column: (await sheetsService.findTodayColumn(formData.khoa))?.columnIndex || 0,
        value: 'TRUE'
      },
      attendanceStatus: 'completed',
      // Full student information
      studentInfo: {
        stt: studentInfo.stt,
        ngayDk: studentInfo.ngayDk,
        hoTen: studentInfo.hoTen,
        ngaySinh: studentInfo.ngaySinh,
        cccd: studentInfo.cccd,
        soDienThoai: studentInfo.soDienThoai,
        hang: studentInfo.hang,
        tinhTrang: studentInfo.tinhTrang,
        khuVuc: studentInfo.khuVuc,
        khoa: studentInfo.khoa
      }
    }

    // Send to webhook
    try {
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

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Điểm danh thành công! Đã đánh dấu TRUE trên Google Sheet cho ${studentInfo.hoTen}`,
      code: code,
      data: {
        hoTen: studentInfo.hoTen,
        khoa: formData.khoa,
        thoiGian: now.toLocaleString('vi-VN'),
        sheetRow: studentInfo.row,
        googleSheetsMarked: true,
        markValue: 'TRUE'
      }
    })

  } catch (error) {
    console.error('Confirm attendance error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống, vui lòng thử lại' },
      { status: 500 }
    )
  }
}