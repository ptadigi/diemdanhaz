import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/google-sheets'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

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

    // Check attendance time window using settings
    const now = new Date()
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
    const currentMinutes = vietnamTime.getHours() * 60 + vietnamTime.getMinutes()
    
    // Get settings from localStorage (since this is server-side, we'll use default settings)
    // In production, these should come from a database or environment variables
    let startHour = 19, startMinute = 10, endHour = 19, endMinute = 30, isActive = true
    
    try {
      // Try to get settings from a settings file or database
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

    // Debug logging
    console.log('Looking for student:', { hoTen, cccd, soDienThoai, khoa })

    // Find student in Google Sheet
    const studentInfo = await sheetsService.findStudent(hoTen, cccd, soDienThoai, khoa)
    
    console.log('Found student:', studentInfo)
    
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

    // Return success response with student info (không tạo mã mới)
    return NextResponse.json({
      success: true,
      message: 'Xác thực thông tin thành công',
      studentInfo: studentInfo
    })

  } catch (error) {
    console.error('Verify attendance error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống, vui lòng thử lại' },
      { status: 500 }
    )
  }
}