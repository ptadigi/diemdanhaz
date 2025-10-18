import { google } from 'googleapis'

export interface GoogleSheetsConfig {
  spreadsheetId: string
  serviceAccountEmail: string
  privateKey: string
}

export interface SheetInfo {
  title: string
  sheetId: number
  rowCount: number
  columnCount: number
}

export interface StudentData {
  rowIndex: number
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
  [key: string]: any // For date columns
}

export class GoogleSheetsService {
  private sheets: any
  private config: GoogleSheetsConfig

  constructor(config: GoogleSheetsConfig) {
    this.config = config
  }

  async initialize() {
    try {
      const auth = new google.auth.JWT(
        this.config.serviceAccountEmail,
        undefined,
        this.config.privateKey,
        [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/spreadsheets'
        ]
      )

      this.sheets = google.sheets({ version: 'v4', auth })
      console.log('✅ Google Sheets client initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets client:', error)
      throw error
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId
      })
      return !!response.data.properties
    } catch (error) {
      console.error('❌ Google Sheets connection test failed:', error)
      return false
    }
  }

  async getSpreadsheetInfo(): Promise<any> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId
      })

      return {
        title: response.data.properties?.title,
        sheets: response.data.sheets?.map(sheet => ({
          title: sheet.properties?.title,
          sheetId: sheet.properties?.sheetId,
          rowCount: sheet.properties?.gridProperties?.rowCount,
          columnCount: sheet.properties?.gridProperties?.columnCount
        }))
      }
    } catch (error) {
      console.error('❌ Failed to get spreadsheet info:', error)
      throw error
    }
  }

  async getSheetData(sheetName: string, range: string = 'A:Z'): Promise<any[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `'${sheetName}'!${range}`
      })

      return response.data.values || []
    } catch (error) {
      console.error(`❌ Failed to get sheet data for ${sheetName}:`, error)
      throw error
    }
  }

  async getStudentsByKhoa(khoa: string): Promise<StudentData[]> {
    try {
      // Get all sheet names first
      const spreadsheetInfo = await this.getSpreadsheetInfo()
      const targetSheet = spreadsheetInfo.sheets.find((sheet: any) => 
        sheet.title && sheet.title.toLowerCase().includes(khoa.toLowerCase())
      )

      if (!targetSheet) {
        throw new Error(`Sheet for khoa ${khoa} not found`)
      }

      // Get all data from the sheet
      const data = await this.getSheetData(targetSheet.title)
      
      if (data.length < 2) {
        return [] // No data or only headers
      }

      // Find header row
      const headers = data[0]
      const students: StudentData[] = []

      // Process data rows (skip header)
      for (let i = 1; i < data.length; i++) {
        const row = data[i]
        if (!row[0]) continue // Skip empty rows

        const student: StudentData = {
          rowIndex: i + 1,
          stt: row[0] || '',
          ngayDk: row[1] || '',
          hoTen: row[2] || '',
          ngaySinh: row[3] || '',
          cccd: row[4] || '',
          sdt: row[5] || '',
          hang: row[6] || '',
          tt: row[7] || '',
          khuVuc: row[8] || '',
          khoa: row[9] || khoa
        }

        // Add date columns (dynamic)
        for (let j = 10; j < row.length; j++) {
          const header = headers[j] || `Column${j + 1}`
          student[header] = row[j] || ''
        }

        students.push(student)
      }

      return students.filter(student => student.hoTen.trim() !== '')
    } catch (error) {
      console.error(`❌ Failed to get students for khoa ${khoa}:`, error)
      throw error
    }
  }

  async updateAttendance(
    sheetName: string, 
    rowIndex: number, 
    columnIndex: number, 
    value: string
  ): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: `'${sheetName}'!R${rowIndex}C${columnIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[value]]
        }
      })

      console.log(`✅ Updated attendance at ${sheetName}!R${rowIndex}C${columnIndex} = ${value}`)
    } catch (error) {
      console.error(`❌ Failed to update attendance:`, error)
      throw error
    }
  }

  async findDateColumn(sheetName: string, targetDate: string): Promise<number | null> {
    try {
      const headers = await this.getSheetData(sheetName, '1:1')
      if (headers.length === 0) return null

      const headerRow = headers[0]
      
      // Find column with target date (various formats)
      for (let i = 0; i < headerRow.length; i++) {
        const header = headerRow[i]
        if (header && header.includes(targetDate)) {
          return i + 1 // Return 1-based column index
        }
      }

      return null
    } catch (error) {
      console.error(`❌ Failed to find date column for ${targetDate}:`, error)
      return null
    }
  }

  async markAttendance(
    khoa: string, 
    studentName: string, 
    date: string, 
    status: 'TRUE' | 'FALSE' = 'TRUE'
  ): Promise<boolean> {
    try {
      // Get students
      const students = await this.getStudentsByKhoa(khoa)
      
      // Find student
      const student = students.find(s => 
        s.hoTen.toLowerCase().includes(studentName.toLowerCase())
      )
      
      if (!student) {
        throw new Error(`Student ${studentName} not found in khoa ${khoa}`)
      }

      // Get spreadsheet info to find sheet name
      const spreadsheetInfo = await this.getSpreadsheetInfo()
      const targetSheet = spreadsheetInfo.sheets.find((sheet: any) => 
        sheet.title && sheet.title.toLowerCase().includes(khoa.toLowerCase())
      )

      if (!targetSheet) {
        throw new Error(`Sheet for khoa ${khoa} not found`)
      }

      // Find date column
      const dateColumn = await this.findDateColumn(targetSheet.title, date)
      if (!dateColumn) {
        throw new Error(`Date column for ${date} not found`)
      }

      // Update attendance
      await this.updateAttendance(
        targetSheet.title,
        student.rowIndex,
        dateColumn,
        status
      )

      return true
    } catch (error) {
      console.error(`❌ Failed to mark attendance:`, error)
      throw error
    }
  }
}

// Singleton instance
let googleSheetsService: GoogleSheetsService | null = null

export function getGoogleSheetsService(): GoogleSheetsService {
  if (!googleSheetsService) {
    const config: GoogleSheetsConfig = {
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      privateKey: (process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')) || ''
    }

    googleSheetsService = new GoogleSheetsService(config)
  }

  return googleSheetsService
}