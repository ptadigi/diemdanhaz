'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Download,
  ArrowLeft,
  Filter,
  Eye,
  Database,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ReportData {
  date: string
  totalStudents: number
  attendedStudents: number
  attendanceRate: number
  sessions: SessionReport[]
}

interface SessionReport {
  id: string
  title: string
  khoa: string
  startTime: string
  endTime: string
  attendanceCode: string
  attendedCount: number
  totalCount: number
}

interface StudentAttendance {
  studentName: string
  khoa: string
  totalSessions: number
  attendedSessions: number
  attendanceRate: number
  lastAttendance: string
}

export default function ReportsPage() {
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([])
  const [khoaList, setKhoaList] = useState<string[]>(['K15', 'K16', 'K17']) // Default values
  const [selectedKhoa, setSelectedKhoa] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7days')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingKhoa, setIsLoadingKhoa] = useState(false)
  const [googleSheetsConnected, setGoogleSheetsConnected] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview')

  useEffect(() => {
    checkAuth()
    fetchKhoaList()
    fetchReportData()
  }, [])

  useEffect(() => {
    fetchReportData()
  }, [selectedKhoa, selectedPeriod])

  const fetchKhoaList = async () => {
    setIsLoadingKhoa(true)
    try {
      const response = await fetch('/api/admin/khoa')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.khoaList.length > 0) {
          setKhoaList(data.khoaList)
          setGoogleSheetsConnected(true)
        }
      } else {
        console.log('Using default khoa list')
        setGoogleSheetsConnected(false)
      }
    } catch (error) {
      console.log('Failed to fetch khoa list, using defaults:', error)
      setGoogleSheetsConnected(false)
    } finally {
      setIsLoadingKhoa(false)
    }
  }

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check')
      if (!response.ok) {
        router.push('/admin')
        return
      }
    } catch (error) {
      router.push('/admin')
    }
  }

  const fetchReportData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          khoa: selectedKhoa,
          period: selectedPeriod
        })
      })

      if (response.ok) {
        const data = await response.json()
        setReportData(data.reports || [])
        setStudentAttendance(data.studentAttendance || [])
      } else {
        toast.error('Lỗi khi tải dữ liệu báo cáo')
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error)
      toast.error('Lỗi khi tải dữ liệu báo cáo')
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const response = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          khoa: selectedKhoa,
          period: selectedPeriod,
          format: 'csv'
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Xuất báo cáo thành công!')
      } else {
        toast.error('Lỗi khi xuất báo cáo')
      }
    } catch (error) {
      toast.error('Lỗi khi xuất báo cáo')
    }
  }

  const calculateOverallStats = () => {
    if (reportData.length === 0) return { totalSessions: 0, totalAttendances: 0, avgRate: 0 }
    
    const totalSessions = reportData.reduce((sum, day) => sum + day.sessions.length, 0)
    const totalAttendances = reportData.reduce((sum, day) => sum + day.attendedStudents, 0)
    const avgRate = reportData.reduce((sum, day) => sum + day.attendanceRate, 0) / reportData.length

    return { totalSessions, totalAttendances, avgRate }
  }

  const stats = calculateOverallStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin/dashboard')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Thống kê báo cáo
                </h1>
                <p className="text-sm text-slate-600">
                  Xem thống kê và báo cáo điểm danh
                </p>
              </div>
            </div>
            
            <Button onClick={exportReport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Google Sheets Connection Status */}
        {googleSheetsConnected !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className={googleSheetsConnected ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
              <div className="flex items-center gap-2">
                {googleSheetsConnected ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ✅ Đã kết nối Google Sheets - Đang sử dụng dữ liệu thật từ {khoaList.length} khóa học
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      ⚠️ Không thể kết nối Google Sheets - Đang sử dụng dữ liệu mẫu
                    </AlertDescription>
                  </>
                )}
              </div>
            </Alert>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Bộ lọc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Khóa học</label>
                  <Select value={selectedKhoa} onValueChange={setSelectedKhoa}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khóa học" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả các khóa</SelectItem>
                      {khoaList.map((khoa) => (
                        <SelectItem key={khoa} value={khoa}>
                          {khoa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Khoảng thời gian</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khoảng thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">7 ngày qua</SelectItem>
                      <SelectItem value="30days">30 ngày qua</SelectItem>
                      <SelectItem value="90days">90 ngày qua</SelectItem>
                      <SelectItem value="all">Tất cả thời gian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Tổng phiên điểm danh</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalSessions}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Tổng lượt điểm danh</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalAttendances}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Tỷ lệ tham gia trung bình</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.avgRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                <Button
                  variant={activeTab === 'overview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('overview')}
                  className="flex-1"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Tổng quan
                </Button>
                <Button
                  variant={activeTab === 'students' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('students')}
                  className="flex-1"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Chi tiết học viên
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activeTab === 'overview' ? (
                <div className="space-y-4">
                  {reportData.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        Không có dữ liệu trong khoảng thời gian đã chọn
                      </AlertDescription>
                    </Alert>
                  ) : (
                    reportData.map((day, index) => (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{day.date}</h3>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600">
                              {day.attendedStudents}/{day.totalStudents} học viên
                            </span>
                            <Badge variant={day.attendanceRate >= 80 ? "default" : "secondary"}>
                              {day.attendanceRate.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {day.sessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{session.title}</span>
                                <span className="text-slate-600">{session.khoa}</span>
                                <span className="text-slate-500">{session.startTime} - {session.endTime}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                                  {session.attendanceCode}
                                </span>
                                <span className="text-slate-600">
                                  {session.attendedCount}/{session.totalCount}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {studentAttendance.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        Không có dữ liệu học viên trong khoảng thời gian đã chọn
                      </AlertDescription>
                    </Alert>
                  ) : (
                    studentAttendance.map((student, index) => (
                      <motion.div
                        key={`${student.studentName}-${student.khoa}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{student.studentName}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                              <span>Khóa: {student.khoa}</span>
                              <span>Lần điểm danh cuối: {student.lastAttendance}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {student.attendedSessions}/{student.totalSessions}
                            </div>
                            <Badge variant={student.attendanceRate >= 80 ? "default" : "secondary"}>
                              {student.attendanceRate.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}