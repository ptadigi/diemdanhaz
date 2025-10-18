import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getGoogleSheetsService } from '@/lib/google-sheets'

// Hàm đồng bộ dữ liệu từ Google Sheets xuống database
async function syncFromGoogleSheets(sessionId: string) {
  try {
    // Lấy thông tin session
    const session = await db.diemDanhSession.findUnique({
      where: { id: sessionId }
    })
    
    if (!session) {
      throw new Error('Session not found')
    }
    
    // Cập nhật trạng thái đồng bộ
    await db.diemDanhSession.update({
      where: { id: sessionId },
      data: {
        syncStatus: 'syncing',
        lastSyncAt: new Date()
      }
    })
    
    // Initialize Google Sheets service
    const sheetsService = getGoogleSheetsService()
    await sheetsService.initialize()
    
    // Lấy dữ liệu từ Google Sheets theo khóa
    const students = await sheetsService.getStudentsByKhoa(session.khoa || 'K15')
    
    // Xử lý dữ liệu đồng bộ
    let syncedCount = 0
    for (const student of students) {
      // Kiểm tra xem record đã tồn tại chưa
      const existingRecord = await db.diemDanhRecord.findFirst({
        where: {
          sessionId: sessionId,
          cccd: student.cccd,
          hoTen: student.hoTen
        }
      })
      
      if (!existingRecord) {
        // Tạo record mới
        await db.diemDanhRecord.create({
          data: {
            sessionId: sessionId,
            hoTen: student.hoTen,
            cccd: student.cccd,
            soDienThoai: student.sdt,
            khoa: student.khoa,
            ngaySinh: student.ngaySinh,
            ghiChu: `Đồng bộ từ Google Sheets - Hạng: ${student.hang}`,
            isPresent: false, // Mặc định là chưa điểm danh
            googleSheetRow: student.rowIndex,
            syncStatus: 'synced',
            lastSyncAt: new Date()
          }
        })
        syncedCount++
      } else {
        // Cập nhật record đã tồn tại
        await db.diemDanhRecord.update({
          where: { id: existingRecord.id },
          data: {
            googleSheetRow: student.rowIndex,
            syncStatus: 'synced',
            lastSyncAt: new Date()
          }
        })
      }
    }
    
    // Cập nhật trạng thái session
    await db.diemDanhSession.update({
      where: { id: sessionId },
      data: {
        syncStatus: 'synced',
        lastSyncAt: new Date()
      }
    })
    
    return {
      success: true,
      syncedCount,
      totalRecords: students.length
    }
  } catch (error) {
    // Cập nhật trạng thái lỗi
    await db.diemDanhSession.update({
      where: { id: sessionId },
      data: {
        syncStatus: 'error',
        lastSyncAt: new Date()
      }
    })
    
    throw error
  }
}

// Hàm đồng bộ dữ liệu lên Google Sheets
async function syncToGoogleSheets(sessionId: string) {
  try {
    // Lấy tất cả records của session
    const records = await db.diemDanhRecord.findMany({
      where: { sessionId: sessionId },
      include: { session: true }
    })
    
    if (records.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        message: 'No records to sync'
      }
    }
    
    // Initialize Google Sheets service
    const sheetsService = getGoogleSheetsService()
    await sheetsService.initialize()
    
    // Get today's date for column matching
    const today = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    }).replace(/\//g, '/')
    
    let syncedCount = 0
    
    for (const record of records) {
      if (record.isPresent && record.googleSheetRow) {
        try {
          // Find the sheet for this khoa
          const spreadsheetInfo = await sheetsService.getSpreadsheetInfo()
          const targetSheet = spreadsheetInfo.sheets.find((sheet: any) => 
            sheet.title.toLowerCase().includes(record.session.khoa?.toLowerCase() || 'k15')
          )
          
          if (targetSheet) {
            // Find date column
            const dateColumn = await sheetsService.findDateColumn(targetSheet.title, today)
            
            if (dateColumn) {
              // Mark attendance in Google Sheets
              await sheetsService.updateAttendance(
                targetSheet.title,
                record.googleSheetRow,
                dateColumn,
                'TRUE'
              )
              
              // Update record sync status
              await db.diemDanhRecord.update({
                where: { id: record.id },
                data: {
                  syncStatus: 'synced',
                  lastSyncAt: new Date()
                }
              })
              
              syncedCount++
            }
          }
        } catch (error) {
          console.error(`Failed to sync record ${record.id}:`, error)
          
          // Mark as error
          await db.diemDanhRecord.update({
            where: { id: record.id },
            data: {
              syncStatus: 'error',
              lastSyncAt: new Date()
            }
          })
        }
      }
    }
    
    return {
      success: true,
      syncedCount
    }
  } catch (error) {
    throw error
  }
}

// API endpoint để trigger đồng bộ
export async function POST(request: NextRequest) {
  try {
    const { sessionId, direction = 'from-google-sheets' } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    let result
    
    if (direction === 'from-google-sheets') {
      result = await syncFromGoogleSheets(sessionId)
    } else if (direction === 'to-google-sheets') {
      result = await syncToGoogleSheets(sessionId)
    } else {
      return NextResponse.json(
        { error: 'Invalid sync direction' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      ...result
    })
    
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { 
        error: 'Sync failed',
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

// API endpoint để kiểm tra trạng thái đồng bộ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    const session = await db.diemDanhSession.findUnique({
      where: { id: sessionId },
      include: {
        attendanceRecords: {
          select: {
            id: true,
            syncStatus: true,
            lastSyncAt: true,
            googleSheetRow: true
          }
        }
      }
    })
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    const stats = {
      totalRecords: session.attendanceRecords.length,
      syncedRecords: session.attendanceRecords.filter(r => r.syncStatus === 'synced').length,
      pendingRecords: session.attendanceRecords.filter(r => r.syncStatus === 'pending').length,
      errorRecords: session.attendanceRecords.filter(r => r.syncStatus === 'error').length,
      sessionSyncStatus: session.syncStatus,
      lastSyncAt: session.lastSyncAt
    }
    
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        syncStatus: session.syncStatus,
        lastSyncAt: session.lastSyncAt,
        spreadsheetId: session.spreadsheetId
      },
      stats
    })
    
  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}