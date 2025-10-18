import { google } from 'googleapis'

export interface StudentData {
  stt: string
  ngayDk: string
  hoTen: string
  ngaySinh: string
  cccd: string
  sdt: string
  hang: string
  tt: string
  khuVuc: string
  khoa: string
  row: number
  [key: string]: any
}

export class GoogleSheetsApiKeyService {
  private sheets: any
  private spreadsheetId: string

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!
    
    // Use API Key for authentication
    const API_KEY = 'AQ.Ab8RN6LRnJv2pTrue0kMYMGWyaX6irEYrAdoSzDsyeN6ZuQ76w'
    
    this.sheets = google.sheets({ 
      version: 'v4',
      auth: API_KEY
    })
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test with Drive API first (supports API keys)
      const drive = google.drive({ 
        version: 'v3',
        auth: 'AQ.Ab8RN6LRnJv2pTrue0kMYMGWyaX6irEYrAdoSzDsyeN6ZuQ76w'
      })
      
      const response = await drive.files.get({
        fileId: this.spreadsheetId,
        fields: 'name, id'
      })
      
      return !!response.data.name
    } catch (error) {
      console.error('❌ API Key connection test failed:', error)
      return false
    }
  }

  async getSpreadsheetInfo(): Promise<any> {
    try {
      // For now, return mock data since Sheets API doesn't support API keys
      return {
        title: 'Học Lái Xe AZ - Điểm Danh',
        sheets: [
          { title: 'K15', sheetId: 0, rowCount: 100, columnCount: 50 },
          { title: 'K16', sheetId: 1, rowCount: 100, columnCount: 50 },
          { title: 'K17', sheetId: 2, rowCount: 100, columnCount: 50 }
        ]
      }
    } catch (error) {
      console.error('❌ Failed to get spreadsheet info:', error)
      throw error
    }
  }

  async getSheetData(sheetName: string, range: string = 'A:Z'): Promise<any[][]> {
    try {
      // For now, return mock data
      if (sheetName === 'K15') {
        return [
          ['STT', 'Ngày ĐK', 'Họ và Tên', 'Ngày Sinh', 'CCCD', 'SĐT', 'Hạng', 'TT', 'Khu Vực', 'Khóa', '18/10', '19/10', '20/10'],
          ['1', '01/10/2024', 'MOLOM QUỐC', '15/05/1990', '123456789', '0912345678', 'B2', 'Đang học', 'Hà Nội', 'K15', '', ''],
          ['2', '02/10/2024', 'NGUYỄN VĂN A', '20/08/1992', '987654321', '0987654321', 'B1', 'Đang học', 'HCM', 'K15', '', '']
        ]
      } else if (sheetName === 'K16') {
        return [
          ['STT', 'Ngày ĐK', 'Họ và Tên', 'Ngày Sinh', 'CCCD', 'SĐT', 'Hạng', 'TT', 'Khu Vực', 'Khóa', '18/10', '19/10', '20/10'],
          ['1', '01/10/2024', 'TRẦN THỊ B', '10/03/1991', '456789123', '0976543210', 'A1', 'Đang học', 'Đà Nẵng', 'K16', '', '']
        ]
      }
      
      return []
    } catch (error) {
      console.error(`❌ Failed to get sheet data for ${sheetName}:`, error)
      return []
    }
  }

  async getStudentsByKhoa(khoa: string): Promise<StudentData[]> {
    try {
      const data = await this.getSheetData(khoa)
      
      if (data.length < 2) {
        return []
      }

      const students: StudentData[] = []
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i]
        if (!row[0]) continue

        const student: StudentData = {
          stt: row[0] || '',
          ngayDk: row[1] || '',
          hoTen: row[2] || '',
          ngaySinh: row[3] || '',
          cccd: row[4] || '',
          sdt: row[5] || '',
          hang: row[6] || '',
          tt: row[7] || '',
          khuVuc: row[8] || '',
          khoa: row[9] || khoa,
          row: i + 1
        }

        // Add date columns
        for (let j = 10; j < row.length; j++) {
          const header = data[0][j] || `Column${j + 1}`
          student[header] = row[j] || ''
        }

        students.push(student)
      }

      return students.filter(student => student.hoTen.trim() !== '')
    } catch (error) {
      console.error(`❌ Failed to get students for khoa ${khoa}:`, error)
      return []
    }
  }

  async findStudent(hoTen: string, cccd: string, soDienThoai: string, khoa: string): Promise<any> {
    try {
      const students = await this.getStudentsByKhoa(khoa)
      
      const student = students.find(s => 
        s.hoTen.toLowerCase().includes(hoTen.toLowerCase()) ||
        s.cccd === cccd ||
        s.sdt === soDienThoai
      )
      
      if (student) {
        return {
          stt: student.stt,
          ngayDk: student.ngayDk,
          hoTen: student.hoTen,
          ngaySinh: student.ngaySinh,
          cccd: student.cccd,
          soDienThoai: student.sdt,
          hang: student.hang,
          tinhTrang: student.tt,
          khuVuc: student.khuVuc,
          khoa: student.khoa,
          row: student.row
        }
      }
      
      return null
    } catch (error) {
      console.error('❌ Error finding student:', error)
      throw error
    }
  }

  async checkAttendanceStatus(studentInfo: any): Promise<boolean> {
    try {
      const today = new Date()
      const dateStr = today.getDate().toString().padStart(2, '0') + '/' + 
                    (today.getMonth() + 1).toString().padStart(2, '0')
      
      const students = await this.getStudentsByKhoa(studentInfo.khoa)
      const student = students.find(s => s.row === studentInfo.row)
      
      if (student && student[dateStr]) {
        return student[dateStr].toString().trim() !== ''
      }
      
      return false
    } catch (error) {
      console.error('❌ Error checking attendance status:', error)
      return false
    }
  }

  async getStudents(khoa: string): Promise<any[]> {
    try {
      return await this.getStudentsByKhoa(khoa)
    } catch (error) {
      console.error('❌ Error getting students:', error)
      return []
    }
  }
}