'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Copy,
  Eye,
  Play,
  Square
} from 'lucide-react'
import { toast } from 'sonner'
import GoogleSheetsSync from './GoogleSheetsSync'

interface Session {
  id: string
  sessionCode: string
  title: string
  startTime: string
  endTime: string
  isActive: boolean
  attendanceCount: number
  presentCount: number
  attendanceRecords?: Array<{
    id: string
    hoTen: string
    khoa: string
    diemDanhLuc: string
    isPresent: boolean
  }>
}

interface ReportData {
  headers: string[]
  rows: string[][]
  summary: {
    total: number
    present: number
    absent: number
    date: string
  }
}

export default function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoadingReport, setIsLoadingReport] = useState(false)

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      // Cleanup expired sessions first
      try {
        await fetch('/api/admin/cleanup', { method: 'POST' })
      } catch (cleanupError) {
        console.log('Cleanup failed, continuing...')
      }

      const response = await fetch('/api/admin/sessions')
      const data = await response.json()
      
      if (data.success) {
        setSessions(data.sessions)
      } else {
        toast.error(data.error || 'Không thể tải danh sách phiên')
      }
    } catch (error) {
      toast.error('Lỗi kết nối')
    } finally {
      setIsLoading(false)
    }
  }

  const createSession = async () => {
    setIsCreating(true)
    try {
      const today = new Date()
      const dateStr = today.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
      
      const response = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Phiên điểm danh ${dateStr}`,
          khoa: 'K15', // Mặc định là K15, có thể thay đổi sau
          duration: 20
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Tạo phiên điểm danh thành công!')
        // Tải lại danh sách phiên để cập nhật ngay lập tức
        await fetchSessions()
      } else {
        toast.error(data.error || 'Tạo phiên thất bại')
      }
    } catch (error) {
      toast.error('Lỗi kết nối')
    } finally {
      setIsCreating(false)
    }
  }

  const fetchReport = async (sessionId: string) => {
    setIsLoadingReport(true)
    try {
      const response = await fetch(`/api/admin/reports?sessionId=${sessionId}`)
      const data = await response.json()
      
      if (data.success) {
        setReportData(data.data)
        setSelectedSession(sessions.find(s => s.id === sessionId) || null)
      } else {
        toast.error(data.error || 'Không thể tải báo cáo')
      }
    } catch (error) {
      toast.error('Lỗi kết nối')
    } finally {
      setIsLoadingReport(false)
    }
  }

  const copySessionCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Đã sao chép mã phiên')
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const isSessionActive = (session: Session) => {
    const now = new Date()
    const endTime = new Date(session.endTime)
    return session.isActive && now < endTime
  }

  return (
    <div className="space-y-6">
      {/* Nút tạo phiên nhanh */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Tạo phiên điểm danh nhanh</h3>
              <p className="text-sm text-gray-600 mt-1">
                Tạo phiên cho ngày hôm nay, tự động kéo dài 20 phút
              </p>
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Chỉ có một phiên hoạt động tại một thời điểm
              </p>
            </div>
            <Button
              onClick={createSession}
              disabled={isCreating || sessions.some(isSessionActive)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium px-6"
            >
              {isCreating ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Tạo phiên mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Phiên đang hoạt động */}
      {sessions.some(isSessionActive) && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Clock className="w-5 h-5" />
              Phiên đang hoạt động (Duy nhất)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.filter(isSessionActive).map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-green-600 text-white">
                        ĐANG MỞ
                      </Badge>
                      <div>
                        <h4 className="font-semibold">{session.title}</h4>
                        <p className="text-sm text-gray-600">
                          Kết thúc: {formatTime(session.endTime)}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          ✅ Đây là phiên hoạt động duy nhất tại thời điểm này
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{session.presentCount}</p>
                        <p className="text-xs text-gray-600">Đã điểm danh</p>
                      </div>
                      <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg">
                        <span className="text-sm font-medium">Mã:</span>
                        <code className="bg-white px-2 py-1 rounded text-sm font-mono font-bold text-blue-600">
                          {session.sessionCode}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copySessionCode(session.sessionCode)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Thêm Google Sheets Sync cho phiên đang hoạt động */}
                <GoogleSheetsSync 
                  sessionId={session.id} 
                  sessionTitle={session.title}
                />
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Danh sách các phiên khác */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Lịch sử phiên điểm danh
            </CardTitle>
            <Button
              onClick={fetchSessions}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
              <p className="mt-2">Đang tải...</p>
            </div>
          ) : sessions.filter(s => !isSessionActive(s)).length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Chưa có phiên nào đã kết thúc. Tạo phiên mới để bắt đầu điểm danh.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {sessions.filter(s => !isSessionActive(s)).map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        Đã kết thúc
                      </Badge>
                      <div>
                        <h4 className="font-medium">{session.title}</h4>
                        <p className="text-sm text-gray-600">
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">{session.presentCount}/{session.attendanceCount}</p>
                        <p className="text-xs text-gray-600">Có mặt/Tổng</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchReport(session.id)}
                        disabled={isLoadingReport}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Báo cáo
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Báo cáo */}
      {reportData && selectedSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Báo cáo: {selectedSession.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingReport ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
                <p className="mt-2">Đang tải báo cáo...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tóm tắt */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{reportData.summary.total}</p>
                    <p className="text-sm text-gray-600">Tổng số</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{reportData.summary.present}</p>
                    <p className="text-sm text-gray-600">Có mặt</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{reportData.summary.absent}</p>
                    <p className="text-sm text-gray-600">Vắng mặt</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-600">{reportData.summary.date}</p>
                    <p className="text-sm text-gray-600">Ngày</p>
                  </div>
                </div>

                {/* Bảng chi tiết */}
                {reportData.rows && reportData.rows.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {reportData.headers.map((header, index) => (
                              <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-2 text-sm border-b">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Chưa có dữ liệu chi tiết cho phiên này.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}