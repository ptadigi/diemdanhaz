import { NextRequest, NextResponse } from 'next/server'
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

    // Mock student data (simulating Google Sheets lookup)
    const mockStudents = {
      'K15': [
        {
          stt: '1',
          ngayDk: '01/10/2024',
          hoTen: 'MOLOM QUỐC',
          ngaySinh: '15/05/1990',
          cccd: '123456789',
          soDienThoai: '0912345678',
          hang: 'B2',
          tinhTrang: 'Đang học',
          khuVuc: 'Hà Nội',
          khoa: 'K15',
          row: 2
        },
        {
          stt: '2',
          ngayDk: '02/10/2024',
          hoTen: 'NGUYỄN VĂN A',
          ngaySinh: '20/08/1992',
          cccd: '987654321',
          soDienThoai: '0987654321',
          hang: 'B1',
          tinhTrang: 'Đang học',
          khuVuc: 'HCM',
          khoa: 'K15',
          row: 3
        }
      ],
      'K16': [
        {
          stt: '1',
          ngayDk: '01/10/2024',
          hoTen: 'TRẦN THỊ B',
          ngaySinh: '10/03/1991',
          cccd: '456789123',
          soDienThoai: '0976543210',
          hang: 'A1',
          tinhTrang: 'Đang học',
          khuVuc: 'Đà Nẵng',
          khoa: 'K16',
          row: 2
        }
      ]
    }

    // Find student in mock data
    const students = mockStudents[khoa as keyof typeof mockStudents] || []
    const studentInfo = students.find(s => 
      s.hoTen.toLowerCase().includes(hoTen.toLowerCase()) ||
      s.cccd === cccd ||
      s.soDienThoai === soDienThoai
    )
    
    console.log('Looking for student:', { hoTen, cccd, soDienThoai, khoa })
    console.log('Found student:', studentInfo)
    
    if (!studentInfo) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin học viên. Vui lòng kiểm tra lại tên, CCCD hoặc số điện thoại.' },
        { status: 404 }
      )
    }

    // Check if already marked attendance (mock check)
    const alreadyMarked = false // For now, always allow
    if (alreadyMarked) {
      return NextResponse.json(
        { error: 'Bạn đã điểm danh hôm nay rồi!' },
        { status: 409 }
      )
    }

    // Return success response with student info
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