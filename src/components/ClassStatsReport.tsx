'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  UserCheck, 
  UserX, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface Student {
  name: string
  time: string
  status: 'present' | 'absent'
}

interface ClassStat {
  className: string
  total: number
  present: number
  absent: number
  students: Student[]
}

interface StatsData {
  summary: {
    totalStudents: number
    totalPresent: number
    totalAbsent: number
    totalClasses: number
    date: string
  }
  classStats: ClassStat[]
  sessionId?: string
  fetchedAt: string
}

interface ClassStatsReportProps {
  sessionId?: string
  date?: string
}

export default function ClassStatsReport({ sessionId, date }: ClassStatsReportProps) {
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState(date || '')

  useEffect(() => {
    fetchStats()
  }, [sessionId, selectedDate])

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (sessionId) params.append('sessionId', sessionId)
      if (selectedDate) params.append('date', selectedDate)
      
      const response = await fetch(`/api/admin/stats-fixed?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setStatsData(data.data)
      } else {
        toast.error(data.error || 'Không thể tải thống kê')
      }
    } catch (error) {
      toast.error('Lỗi kết nối')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleClassExpansion = (className: string) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(className)) {
        newSet.delete(className)
      } else {
        newSet.add(className)
      }
      return newSet
    })
  }

  const getAttendanceRate = (present: number, total: number) => {
    if (total === 0) return 0
    return Math.round((present / total) * 100)
  }

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50'
    if (rate >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Báo cáo thống kê theo khóa
          </CardTitle>
          <Button
            onClick={fetchStats}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Date selector */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="date-select" className="text-sm font-medium">
              Chọn ngày:
            </Label>
            <Input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedDate('')
              fetchStats()
            }}
          >
            Hôm nay
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
            <p className="mt-2">Đang tải thống kê...</p>
          </div>
        ) : !statsData ? (
          <Alert>
            <AlertDescription>
              Không thể tải dữ liệu thống kê. Vui lòng kiểm tra kết nối Google Sheets.
            </AlertDescription>
          </Alert>
        ) : statsData.classStats.length === 0 ? (
          <Alert>
            <AlertDescription>
              Chưa có dữ liệu điểm danh nào trong hệ thống. Vui lòng tạo phiên điểm danh và đợi học viên điểm danh.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Tổng quan */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{statsData.summary.totalStudents}</p>
                <p className="text-sm text-gray-600">Tổng học viên</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{statsData.summary.totalPresent}</p>
                <p className="text-sm text-gray-600">Đã điểm danh</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{statsData.summary.totalAbsent}</p>
                <p className="text-sm text-gray-600">Vắng mặt</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{statsData.summary.totalClasses}</p>
                <p className="text-sm text-gray-600">Số khóa</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-600">{statsData.summary.date}</p>
                <p className="text-sm text-gray-600">Ngày</p>
              </div>
            </div>

            {/* Thống kê theo khóa */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Chi tiết theo khóa
              </h3>
              
              {statsData.classStats.map((classStat) => {
                const attendanceRate = getAttendanceRate(classStat.present, classStat.total)
                const isExpanded = expandedClasses.has(classStat.className)
                
                return (
                  <motion.div
                    key={classStat.className}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div 
                      className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleClassExpansion(classStat.className)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <h4 className="font-semibold text-lg">Khóa {classStat.className}</h4>
                          <Badge className={getAttendanceRateColor(attendanceRate)}>
                            {attendanceRate}% có mặt
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1">
                              <UserCheck className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-600">{classStat.present}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <UserX className="w-4 h-4 text-red-600" />
                              <span className="font-medium text-red-600">{classStat.absent}</span>
                            </div>
                            <span className="text-gray-600">/ {classStat.total}</span>
                          </div>
                          
                          <Button variant="ghost" size="sm">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        className="border-t bg-white"
                      >
                        <div className="p-4">
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {classStat.students.map((student, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-2 rounded ${
                                  student.status === 'present' 
                                    ? 'bg-green-50' 
                                    : 'bg-red-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${
                                    student.status === 'present' 
                                      ? 'bg-green-600' 
                                      : 'bg-red-600'
                                  }`} />
                                  <span className="font-medium">{student.name}</span>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  {student.status === 'present' && student.time && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <Clock className="w-3 h-3" />
                                      <span>{student.time}</span>
                                    </div>
                                  )}
                                  
                                  <Badge
                                    variant={student.status === 'present' ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {student.status === 'present' ? 'Có mặt' : 'Vắng mặt'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Footer info */}
            <div className="text-xs text-gray-500 text-center pt-4 border-t">
              Cập nhật lần cuối: {new Date(statsData.fetchedAt).toLocaleString('vi-VN')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}