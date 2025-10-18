import { GoogleAuth, JWT } from 'google-auth-library'
import { google, sheets_v4 } from 'googleapis'

interface StudentInfo {
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

interface AttendanceResult {
  success: boolean
  message: string
  studentInfo?: StudentInfo
  code?: string
}

export class GoogleSheetsService {
  private spreadsheetId: string
  private sheets: sheets_v4.Sheets | null = null

  constructor() {
    // Sử dụng spreadsheet ID từ environment
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM'
  }

  /**
   * Khởi tạo Google Sheets API client với Service Account
   */
  private async initializeSheets(): Promise<sheets_v4.Sheets> {
    if (this.sheets) {
      return this.sheets
    }

    try {
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      const privateKey = process.env.GOOGLE_PRIVATE_KEY

      if (!serviceAccountEmail || !privateKey) {
        throw new Error('Missing Google Service Account credentials')
      }

      // Tạo JWT client
      const auth = new GoogleAuth({
        credentials: {
          client_email: serviceAccountEmail,
          private_key: privateKey.replace(/\\n/g, '\n')
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      })

      const authClient = await auth.getClient()
      
      this.sheets = google.sheets({ version: 'v4', auth: authClient as any })
      
      console.log('✅ Google Sheets API initialized successfully')
      return this.sheets
    } catch (error) {
      console.error('❌ Error initializing Google Sheets API:', error)
      throw error
    }
  }

  /**
   * Lấy dữ liệu từ Google Sheet công khai (không cần API key)
   */
  async getPublicSheetData(sheetName: string): Promise<any[][]> {
    try {
      // Sử dụng CSV export endpoint cho sheet công khai
      const csvUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
      
      const response = await fetch(csvUrl, {
        cache: 'no-store', // Prevent browser caching
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet data: ${response.statusText}`)
      }

      const csvText = await response.text()
      
      // Parse CSV
      const lines = csvText.split('\n').filter(line => line.trim())
      const data: any[][] = []
      
      for (const line of lines) {
        // Simple CSV parsing (handles quoted commas)
        const values: string[] = []
        let currentValue = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim())
            currentValue = ''
          } else {
            currentValue += char
          }
        }
        
        // Add the last value
        values.push(currentValue.trim())
        data.push(values)
      }
      
      return data
    } catch (error) {
      console.error('Error fetching public sheet data:', error)
      return []
    }
  }

  /**
   * Lấy danh sách học viên từ sheet theo khóa
   */
  async getStudents(khoa: string): Promise<StudentInfo[]> {
    try {
      const sheetName = khoa === 'K15' ? 'K15' : 'K16'
      const rows = await this.getPublicSheetData(sheetName)
      
      if (rows.length === 0) {
        return []
      }

      const students: StudentInfo[] = []

      // Duyệt qua các hàng dữ liệu (bỏ qua hàng tiêu đề)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        // Cấu trúc thực tế: 0=STT, 1=NGÀY ĐK, 2=HỌ VÀ TÊN, 3=NGÀY SINH, 4=CCCD, 5=SĐT, 6=HẠNG, 7=TT, 8=KHU VỰC, 9=KHÓA, ...
        const stt = row[0] || ''
        const ngayDk = row[1] || ''
        const hoTen = row[2] || ''
        const ngaySinh = row[3] || ''
        const cccd = row[4] || ''
        const soDienThoai = row[5] || ''
        const hang = row[6] || ''
        const tinhTrang = row[7] || ''
        const khuVuc = row[8] || ''
        const khoaFromSheet = row[9] || ''

        if (hoTen.trim()) {
          students.push({
            row: i + 1, // Google Sheets dùng 1-based indexing
            stt: stt.trim(),
            ngayDk: ngayDk.trim(),
            hoTen: hoTen.trim(),
            ngaySinh: ngaySinh.trim(),
            cccd: cccd?.trim(),
            soDienThoai: soDienThoai?.trim(),
            hang: hang.trim(),
            tinhTrang: tinhTrang.trim(),
            khuVuc: khuVuc.trim(),
            khoa: khoa // Use parameter khoa, not from sheet
          })
        }
      }

      return students
    } catch (error) {
      console.error('Error getting students:', error)
      return []
    }
  }

  /**
   * Tìm học viên theo tên, CCCD, hoặc SĐT
   */
  async findStudent(hoTen: string, cccd: string, soDienThoai: string, khoa: string): Promise<StudentInfo | null> {
    console.log('findStudent called with:', { hoTen, cccd, soDienThoai, khoa })
    
    const students = await this.getStudents(khoa)
    console.log('Total students found:', students.length)
    
    // Tìm chính xác theo tên
    let found = students.find(s => 
      s.hoTen.toLowerCase().includes(hoTen.toLowerCase()) ||
      hoTen.toLowerCase().includes(s.hoTen.toLowerCase())
    )

    console.log('Found by name:', found)

    // Nếu không tìm thấy theo tên, tìm theo CCCD
    if (!found && cccd) {
      found = students.find(s => s.cccd === cccd)
      console.log('Found by CCCD:', found)
    }

    // Nếu vẫn không tìm thấy, tìm theo SĐT
    if (!found && soDienThoai) {
      found = students.find(s => s.soDienThoai === soDienThoai)
      console.log('Found by phone:', found)
    }

    console.log('Final result:', found)
    return found || null
  }

  /**
   * Lấy danh sách các cột ngày tháng
   */
  async getDateColumns(khoa: string): Promise<{ columnIndex: number; dateHeader: string }[]> {
    try {
      const sheetName = khoa === 'K15' ? 'K15' : 'K16'
      const rows = await this.getPublicSheetData(sheetName)
      
      if (rows.length === 0) {
        return []
      }

      const headerRow = rows[0]
      const dateColumns: { columnIndex: number; dateHeader: string }[] = []

      headerRow.forEach((header, index) => {
        // Kiểm tra nếu header chứa ngày tháng
        if (header && /(\d{1,2}[\/\-]\d{1,2})|(\d{1,2}\s+\w+)/i.test(header)) {
          dateColumns.push({
            columnIndex: index + 1, // 1-based indexing
            dateHeader: header
          })
        }
      })

      return dateColumns
    } catch (error) {
      console.error('Error getting date columns:', error)
      return []
    }
  }

  /**
   * Tìm cột ngày hiện tại
   */
  async findTodayColumn(khoa: string): Promise<{ columnIndex: number; dateHeader: string } | null> {
    const dateColumns = await this.getDateColumns(khoa)
    const today = new Date()
    const todayStr = today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    
    // Tìm cột có ngày khớp với hôm nay
    let found = dateColumns.find(col => {
      // Chuẩn hóa và so sánh ngày
      const colDate = col.dateHeader.replace(/[\/\s-]/g, '')
      const todayNorm = todayStr.replace(/[\/\s-]/g, '')
      return colDate.includes(todayNorm) || todayNorm.includes(colDate)
    })

    // Nếu không tìm thấy chính xác, tìm cột gần nhất
    if (!found && dateColumns.length > 0) {
      found = dateColumns[dateColumns.length - 1] // Lấy cột ngày cuối cùng
    }

    return found || null
  }

  /**
   * Cập nhật điểm danh qua webhook đến Google Sheets với fallback
   */
  async updateAttendance(data: {
    hoTen: string;
    cccd: string;
    soDienThoai: string;
    khoa: string;
    daDiemDanh: boolean;
  }): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Updating attendance for:', data.hoTen, 'Class:', data.khoa)
      
      // 1. Thử tìm thông tin học viên trước
      const studentInfo = await this.findStudent(data.hoTen, data.cccd, data.soDienThoai, data.khoa)
      
      if (!studentInfo) {
        throw new Error('Không tìm thấy thông tin học viên trong Google Sheets')
      }
      
      console.log('✅ Found student:', studentInfo.hoTen, 'Row:', studentInfo.row)
      
      // 2. Tìm cột ngày hôm nay
      const todayColumn = await this.findTodayColumn(data.khoa)
      
      if (!todayColumn) {
        throw new Error('Không tìm thấy cột ngày hôm nay trong Google Sheets')
      }
      
      console.log('✅ Found today column:', todayColumn.dateHeader, 'Index:', todayColumn.columnIndex)
      
      // 3. Gửi webhook đến n8n để cập nhật
      const webhookUrl = process.env.WEBHOOK_URL || 'https://n8n.phamthanh.net/webhook/diemdanh';
      
      const webhookData = {
        action: 'update_attendance',
        timestamp: new Date().toISOString(),
        data: {
          ...data,
          studentInfo: studentInfo,
          columnIndex: todayColumn.columnIndex,
          dateHeader: todayColumn.dateHeader,
          directUpdate: true
        }
      }
      
      console.log('📤 Sending webhook with data:', webhookData)
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Webhook response:', result);
      
      return {
        success: true,
        message: `Đã gửi yêu cầu cập nhật điểm danh cho ${data.hoTen} (${studentInfo.row}, ${todayColumn.dateHeader})`
      };
      
    } catch (error) {
      console.error('❌ Error updating attendance via webhook:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật điểm danh: ' + (error as Error).message
      };
    }
  }

  /**
   * Ghi dữ liệu lên Google Sheet (gửi qua webhook để n8n xử lý)
   */
  async markAttendance(studentInfo: StudentInfo, code: string): Promise<AttendanceResult> {
    try {
      const todayColumn = await this.findTodayColumn(studentInfo.khoa)
      
      if (!todayColumn) {
        return {
          success: false,
          message: 'Không tìm thấy cột ngày hôm nay'
        }
      }

      // Gửi thông tin qua webhook để n8n xử lý việc ghi TRUE vào Google Sheet
      return {
        success: true,
        message: `Sẽ đánh dấu điểm danh cho ${studentInfo.hoTen} tại hàng ${studentInfo.row}, cột ${todayColumn.columnIndex}`,
        studentInfo: studentInfo,
        code: code
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      return {
        success: false,
        message: 'Lỗi khi đánh dấu điểm danh trên Google Sheet'
      }
    }
  }

  /**
   * Kiểm tra xem học viên đã điểm danh chưa cho một ngày cụ thể
   */
  async checkAttendanceStatusForDate(studentInfo: StudentInfo, columnIndex: number): Promise<boolean> {
    try {
      const sheetName = studentInfo.khoa === 'K15' ? 'K15' : 'K16'
      const rows = await this.getPublicSheetData(sheetName)
      
      if (studentInfo.row <= rows.length) {
        const value = rows[studentInfo.row - 1]?.[columnIndex - 1] || ''
        return value.toUpperCase() === 'TRUE' || 
               value.toLowerCase() === 'có' ||
               value.toLowerCase() === 'x' ||
               (value.trim() !== '' && value.toUpperCase() !== 'FALSE')
      }

      return false
    } catch (error) {
      console.error('Error checking attendance status for date:', error)
      return false
    }
  }

  /**
   * Ghi trực tiếp điểm danh vào Google Sheets sử dụng Google Sheets API
   */
  async markAttendanceDirect(studentInfo: StudentInfo, dateColumn: { columnIndex: number; dateHeader: string }): Promise<AttendanceResult> {
    try {
      console.log('🔄 Starting direct Google Sheets update for:', studentInfo.hoTen)
      
      // 1. Khởi tạo Google Sheets API
      const sheets = await this.initializeSheets()
      
      // 2. Xác định sheet name
      const sheetName = studentInfo.khoa === 'K15' ? 'K15' : 'K16'
      
      // 3. Tính toán range (A1 notation)
      const columnLetter = this.columnNumberToLetter(dateColumn.columnIndex)
      const range = `${sheetName}!${columnLetter}${studentInfo.row}`
      
      console.log(`📍 Target range: ${range} (Student: ${studentInfo.hoTen}, Date: ${dateColumn.dateHeader})`)
      
      // 4. Ghi giá trị TRUE vào ô
      const response = await sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['TRUE']]
        }
      })

      console.log('✅ Google Sheets update response:', response.data)
      
      // 5. Verify the update
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second for Google Sheets to process
      
      const verifyResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range
      })
      
      const updatedValue = verifyResponse.data.values?.[0]?.[0] || ''
      console.log('🔍 Verification - Updated value:', updatedValue)
      
      if (updatedValue.toUpperCase() === 'TRUE') {
        return {
          success: true,
          message: `✅ Đã đánh dấu điểm danh thành công cho ${studentInfo.hoTen} tại ${range}`,
          studentInfo: studentInfo,
          code: 'SUCCESS'
        }
      } else {
        throw new Error(`Verification failed. Expected TRUE, got ${updatedValue}`)
      }
      
    } catch (error) {
      console.error('❌ Error marking attendance directly:', error)
      return {
        success: false,
        message: `Lỗi khi ghi điểm danh trực tiếp: ${(error as Error).message}`,
        studentInfo: studentInfo,
        code: 'ERROR'
      }
    }
  }

  /**
   * Ghi trực tiếp điểm danh với auto-find today column
   */
  async markAttendanceDirectAuto(studentInfo: StudentInfo): Promise<AttendanceResult> {
    try {
      // 1. Tìm cột ngày hôm nay
      const todayColumn = await this.findTodayColumn(studentInfo.khoa)
      
      if (!todayColumn) {
        return {
          success: false,
          message: 'Không tìm thấy cột ngày hôm nay',
          studentInfo: studentInfo,
          code: 'NO_COLUMN'
        }
      }
      
      console.log(`📅 Found today column: ${todayColumn.dateHeader} (Index: ${todayColumn.columnIndex})`)
      
      // 2. Gọi method markAttendanceDirect
      return await this.markAttendanceDirect(studentInfo, todayColumn)
      
    } catch (error) {
      console.error('❌ Error in auto mark attendance:', error)
      return {
        success: false,
        message: `Lỗi khi tự động đánh dấu điểm danh: ${(error as Error).message}`,
        studentInfo: studentInfo,
        code: 'ERROR'
      }
    }
  }

  /**
   * Chuyển đổi số cột thành chữ cái (1 -> A, 2 -> B, etc.)
   */
  private columnNumberToLetter(columnNumber: number): string {
    let result = ''
    while (columnNumber > 0) {
      columnNumber--
      result = String.fromCharCode(65 + (columnNumber % 26)) + result
      columnNumber = Math.floor(columnNumber / 26)
    }
    return result
  }

  /**
   * Test kết nối Google Sheets API
   */
  async testConnection(): Promise<{ success: boolean; message: string; spreadsheetInfo?: any }> {
    try {
      const sheets = await this.initializeSheets()
      
      // Lấy thông tin spreadsheet
      const response = await sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      })
      
      const spreadsheetInfo = {
        title: response.data.properties?.title,
        sheets: response.data.sheets?.map(sheet => ({
          name: sheet.properties?.title,
          sheetId: sheet.properties?.sheetId
        }))
      }
      
      return {
        success: true,
        message: '✅ Kết nối Google Sheets API thành công',
        spreadsheetInfo
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Lỗi kết nối Google Sheets API: ${(error as Error).message}`
      }
    }
  }

  /**
   * Kiểm tra xem học viên đã điểm danh chưa
   */
  async checkAttendanceStatus(studentInfo: StudentInfo): Promise<boolean> {
    try {
      const sheetName = studentInfo.khoa === 'K15' ? 'K15' : 'K16'
      const todayColumn = await this.findTodayColumn(studentInfo.khoa)

      if (!todayColumn) {
        return false
      }

      const rows = await this.getPublicSheetData(sheetName)
      
      if (studentInfo.row <= rows.length) {
        const value = rows[studentInfo.row - 1]?.[todayColumn.columnIndex - 1] || ''
        return value.toUpperCase() === 'TRUE'
      }

      return false
    } catch (error) {
      console.error('Error checking attendance status:', error)
      return false
    }
  }
}