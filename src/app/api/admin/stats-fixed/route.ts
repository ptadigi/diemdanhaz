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
    const classStatus = new Map() // Lưu trạng thái của từng lớp

    for (const className of classesToCheck) {
      try {
        console.log(`Processing class: ${className}`)
        
        // Lấy danh sách học viên giống như trang điểm danh
        const students = await googleSheets.getStudents(className)
        
        if (students.length === 0) {
          console.log(`No students found for class ${className} - sheet may be empty or not exist`)
          classStatus.set(className, {
            hasData: false,
            message: `Chưa có dữ liệu cho khóa ${className}`
          })
          continue
        }

        console.log(`Found ${students.length} students for class ${className}`)
        classStatus.set(className, {
          hasData: true,
          message: `Đã tải dữ liệu cho ${students.length} học viên`
        })

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

        // Lấy toàn bộ dữ liệu sheet một lần duy nhất
        const allRows = await googleSheets.getPublicSheetData(className)
        
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

            // Kiểm tra trực tiếp từ dữ liệu đã fetch (giống như checkAttendanceStatus)
            let isPresent = false
            if (student.row <= allRows.length) {
              const value = allRows[student.row - 1]?.[targetColumn.columnIndex - 1] || ''
              isPresent = value.toUpperCase() === 'TRUE' || 
                         value.toLowerCase() === 'có' ||
                         value.toLowerCase() === 'x' ||
                         (value.trim() !== '' && value.toUpperCase() !== 'FALSE')
            }
            
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

    // Thêm thông tin về các khóa không có dữ liệu
    const emptyClasses = Array.from(classStatus.entries())
      .filter(([_, status]) => !status.hasData)
      .map(([className, status]) => ({
        className,
        message: status.message,
        total: 0,
        present: 0,
        absent: 0,
        students: [],
        dateColumn: 'N/A'
      }))

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
        classStats: [...classStatsArray, ...emptyClasses],
        classStatus: Object.fromEntries(classStatus),
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