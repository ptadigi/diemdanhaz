import { NextRequest, NextResponse } from 'next/server'
import { GoogleSheetsService } from '@/lib/google-sheets'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const date = searchParams.get('date')
    const khoa = searchParams.get('khoa')

    const googleSheets = new GoogleSheetsService()
    const allClassStats = new Map()
    let totalStudents = 0
    let totalPresent = 0

    // Lấy dữ liệu từ tất cả các khóa hoặc khóa cụ thể
    const classesToCheck = khoa ? [khoa] : ['K15', 'K16']

    for (const className of classesToCheck) {
      try {
        console.log(`Processing class: ${className}`)
        
        // Lấy danh sách học viên giống như trang điểm danh
        const students = await googleSheets.getStudents(className)
        
        if (students.length === 0) {
          console.log(`No students found for class ${className}`)
          continue
        }

        console.log(`Found ${students.length} students for class ${className}`)

        // Lấy các cột ngày
        const dateColumns = await googleSheets.getDateColumns(className)
        console.log(`Found ${dateColumns.length} date columns for class ${className}`)
        
        // Tìm cột ngày cụ thể hoặc ngày gần nhất
        let targetColumn = null
        if (date) {
          // Chuyển đổi định dạng ngày từ YYYY-MM-DD sang DD/MM/YYYY
          const formattedDate = date.includes('-') 
            ? date.split('-').reverse().join('/') 
            : date
          
          // Tìm cột theo ngày cụ thể
          targetColumn = dateColumns.find(col => 
            col.dateHeader.includes(formattedDate) || formattedDate.includes(col.dateHeader.replace(/[\/\s-]/g, ''))
          )
        } else {
          // Nếu không có date parameter, tìm cột ngày hôm nay
          targetColumn = await googleSheets.findTodayColumn(className)
        }
        
        // Nếu vẫn không tìm thấy, lấy cột ngày cuối cùng (mới nhất)
        if (!targetColumn && dateColumns.length > 0) {
          targetColumn = dateColumns[dateColumns.length - 1]
        }

        if (!targetColumn) {
          console.log(`No date column found for class ${className}`)
          continue
        }

        console.log(`Using date column: ${targetColumn.dateHeader} (index: ${targetColumn.columnIndex})`)

        // Phân tích dữ liệu điểm danh cho từng học viên
        const classStats = {
          className,
          total: 0,
          present: 0,
          absent: 0,
          students: [],
          dateColumn: targetColumn.dateHeader
        }

        // Duyệt qua từng học viên và kiểm tra trạng thái điểm danh
        for (const student of students) {
          if (student.hoTen.trim()) {
            classStats.total++
            totalStudents++

            // Sử dụng checkAttendanceStatus giống như trang điểm danh
            const isPresent = await googleSheets.checkAttendanceStatusForDate(student, targetColumn.columnIndex)
            
            if (isPresent) {
              classStats.present++
              totalPresent++
            } else {
              classStats.absent++
            }

            classStats.students.push({
              name: student.hoTen.trim(),
              time: isPresent ? targetColumn.dateHeader : '',
              status: isPresent ? 'present' : 'absent'
            })
          }
        }

        console.log(`Class ${className} stats: ${classStats.present}/${classStats.total} present`)

        if (classStats.total > 0) {
          allClassStats.set(className, classStats)
        }

      } catch (error) {
        console.error(`Error processing class ${className}:`, error)
        continue
      }
    }

    const classStatsArray = Array.from(allClassStats.values()).sort((a, b) => 
      a.className.localeCompare(b.className)
    )

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalStudents,
          totalPresent,
          totalAbsent: totalStudents - totalPresent,
          totalClasses: classStatsArray.length,
          date: date || new Date().toLocaleDateString('vi-VN')
        },
        classStats: classStatsArray,
        sessionId,
        fetchedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống, không thể lấy thống kê', details: error?.message },
      { status: 500 }
    )
  }
}