import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { khoa, period, format } = await request.json()

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

    // Fetch attendance data
    const attendanceRecords = await db.diemDanhRecord.findMany({
      where: {
        diemDanhLuc: {
          gte: startDate,
          lte: endDate
        },
        ...(khoa !== 'all' && { khoa })
      },
      include: {
        session: {
          select: {
            sessionCode: true,
            title: true,
            startTime: true
          }
        }
      },
      orderBy: {
        diemDanhLuc: 'desc'
      }
    })

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Ngày',
        'Mã phiên',
        'Họ tên',
        'Khóa',
        'CCCD',
        'Số điện thoại',
        'Ngày sinh',
        'Thời gian điểm danh',
        'Trạng thái'
      ]
      
      const rows = attendanceRecords.map(record => [
        record.diemDanhLuc.toLocaleDateString('vi-VN'),
        record.session.sessionCode,
        record.hoTen,
        record.khoa,
        record.cccd || '',
        record.soDienThoai || '',
        record.ngaySinh || '',
        record.diemDanhLuc.toLocaleTimeString('vi-VN'),
        record.isPresent ? 'Có mặt' : 'Vắng mặt'
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="attendance-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: attendanceRecords
    })
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}