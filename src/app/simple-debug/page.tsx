'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Users,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface StatsData {
  summary: {
    totalStudents: number
    totalPresent: number
    totalAbsent: number
    totalClasses: number
    date: string
  }
  classStats: Array<{
    className: string
    total: number
    present: number
    absent: number
    students: Array<{
      name: string
      time: string
      status: 'present' | 'absent'
    }>
    dateColumn: string
  }>
}

export default function SimpleDebugPage() {
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/stats-fixed')
      const data = await response.json()

      if (data.success) {
        setStatsData(data.data)
        toast.success('Đã tải dữ liệu thành công')
      } else {
        toast.error(data.error || 'Không thể tải thống kê')
      }
    } catch (error) {
      toast.error('Lỗi kết nối')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Debug Báo Cáo Điểm Danh</h1>
        <Button
          onClick={fetchStats}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : !statsData ? (
        <Alert>
          <AlertDescription>
            Không thể tải dữ liệu thống kê. Vui lòng kiểm tra kết nối Google Sheets.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {/* Tổng quan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Tổng quan ngày {statsData.summary.date}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((statsData.summary.totalPresent / statsData.summary.totalStudents) * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">Tỷ lệ có mặt</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chi tiết theo khóa */}
          {statsData.classStats.map((classStat) => (
            <Card key={classStat.className}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Khóa {classStat.className}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {classStat.present} có mặt
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-600">
                      <XCircle className="w-3 h-3 mr-1" />
                      {classStat.absent} vắng
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 mb-3">
                    Cột ngày: <span className="font-medium">{classStat.dateColumn}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                    {classStat.students.map((student, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          student.status === 'present' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            student.status === 'present' 
                              ? 'bg-green-600' 
                              : 'bg-red-600'
                          }`} />
                          <span className="font-medium text-sm">{student.name}</span>
                        </div>
                        
                        <Badge
                          variant={student.status === 'present' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {student.status === 'present' ? 'Có mặt' : 'Vắng mặt'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Footer */}
          <div className="text-xs text-gray-500 text-center">
            Cập nhật lần cuối: {new Date(statsData.fetchedAt).toLocaleString('vi-VN')}
          </div>
        </div>
      )}
    </div>
  )
}