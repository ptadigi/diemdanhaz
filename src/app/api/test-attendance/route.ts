import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hoTen, cccd, soDienThoai, khoa } = body

    if (!hoTen || !khoa) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp họ tên và khóa' },
        { status: 400 }
      )
    }

    const googleSheets = new GoogleSheetsService()
    
    // 1. Tìm học viên
    const studentInfo = await googleSheets.findStudent(hoTen, cccd || '', soDienThoai || '', khoa)
    
    if (!studentInfo) {
      return NextResponse.json(
        { error: 'Không tìm thấy học viên' },
        { status: 404 }
      )
    }

    // 2. Kiểm tra trạng thái điểm danh hiện tại
    const currentStatus = await googleSheets.checkAttendanceStatus(studentInfo)
    
    // 3. Lấy thông tin cột ngày
    const todayColumn = await googleSheets.findTodayColumn(khoa)
    
    // 4. Lấy dữ liệu thô từ sheet để kiểm tra
    const allRows = await googleSheets.getPublicSheetData(khoa)
    const rawValue = allRows[studentInfo.row - 1]?.[todayColumn?.columnIndex - 1] || ''

    return NextResponse.json({
      success: true,
      data: {
        studentInfo: {
          hoTen: studentInfo.hoTen,
          row: studentInfo.row,
          khoa: studentInfo.khoa
        },
        attendanceStatus: {
          current: currentStatus,
          rawValue: rawValue,
          todayColumn: todayColumn
        },
        message: currentStatus ? 'Học viên đã điểm danh' : 'Học viên chưa điểm danh'
      }
    })

  } catch (error) {
    console.error('Test attendance error:', error)
    return NextResponse.json(
      { error: 'Lỗi: ' + error?.message },
      { status: 500 }
    )
  }
}