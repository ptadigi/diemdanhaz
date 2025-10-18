'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  RefreshCw, 
  Database, 
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface SheetsData {
  khoa: string
  totalRows: number
  dateColumns: Array<{
    columnIndex: number
    dateHeader: string
    sampleData: any[]
  }>
  sampleRows: Array<{
    rowIndex: number
    data: string[]
    hasData: boolean
  }>
  attendanceAnalysis: Array<{
    dateHeader: string
    columnIndex: number
    totalStudents: number
    presentCount: number
    absentCount: number
    emptyCount: number
    sampleValues: Array<{
      studentName: string
      value: string
      rawValue: string
    }>
  }>
}

export default function DebugSheetsPage() {
  const [k15Data, setK15Data] = useState<SheetsData | null>(null)
  const [k16Data, setK16Data] = useState<SheetsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const [k15Response, k16Response] = await Promise.all([
        fetch('/api/debug/sheets-data?khoa=K15'),
        fetch('/api/debug/sheets-data?khoa=K16')
      ])

      const k15Result = await k15Response.json()
      const k16Result = await k16Response.json()

      if (k15Result.success) {
        setK15Data(k15Result.data)
      } else {
        toast.error('Lỗi khi tải dữ liệu K15: ' + k15Result.error)
      }

      if (k16Result.success) {
        setK16Data(k16Result.data)
      } else {
        toast.error('Lỗi khi tải dữ liệu K16: ' + k16Result.error)
      }

    } catch (error) {
      toast.error('Lỗi kết nối')
    } finally {
      setIsLoading(false)
    }
  }

  const renderClassData = (data: SheetsData, className: string) => {
    if (!data) return null

    return (
      <div className="space-y-6">
        {/* Tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Tổng hàng</p>
                  <p className="text-2xl font-bold">{data.totalRows}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Số cột ngày</p>
                  <p className="text-2xl font-bold">{data.dateColumns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Học viên</p>
                  <p className="text-2xl font-bold">
                    {data.attendanceAnalysis[0]?.totalStudents || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Các cột ngày */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Các cột ngày điểm danh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.dateColumns.map((col, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{col.dateHeader}</h4>
                    <Badge variant="outline">Cột {col.columnIndex}</Badge>
                  </div>
                  
                  {data.attendanceAnalysis[index] && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">
                          {data.attendanceAnalysis[index].totalStudents}
                        </p>
                        <p className="text-xs text-gray-600">Tổng học viên</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {data.attendanceAnalysis[index].presentCount}
                        </p>
                        <p className="text-xs text-gray-600">Có mặt</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-600">
                          {data.attendanceAnalysis[index].absentCount}
                        </p>
                        <p className="text-xs text-gray-600">Vắng mặt</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-600">
                          {data.attendanceAnalysis[index].emptyCount}
                        </p>
                        <p className="text-xs text-gray-600">Trống</p>
                      </div>
                    </div>
                  )}

                  {/* Mẫu dữ liệu */}
                  {data.attendanceAnalysis[index]?.sampleValues.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Mẫu dữ liệu:</p>
                      <div className="space-y-1">
                        {data.attendanceAnalysis[index].sampleValues.map((sample, idx) => (
                          <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                            <span className="font-medium">{sample.studentName}</span>: 
                            <span className="ml-2 font-mono bg-white px-1 rounded">
                              {sample.rawValue}
                            </span>
                            <Badge 
                              variant={sample.value.toUpperCase() === 'TRUE' ? 'default' : 'secondary'}
                              className="ml-2 text-xs"
                            >
                              {sample.value.toUpperCase() === 'TRUE' ? 'Có mặt' : 'Chưa rõ'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mẫu hàng dữ liệu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Mẫu dữ liệu (5 hàng đầu)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Hàng</th>
                    <th className="p-2 text-left">STT</th>
                    <th className="p-2 text-left">Ngày ĐK</th>
                    <th className="p-2 text-left">Họ và Tên</th>
                    <th className="p-2 text-left">Ngày Sinh</th>
                    <th className="p-2 text-left">CCCD</th>
                    <th className="p-2 text-left">SĐT</th>
                    <th className="p-2 text-left">Hạng</th>
                    <th className="p-2 text-left">TT</th>
                    <th className="p-2 text-left">Khu vực</th>
                    <th className="p-2 text-left">Khóa</th>
                    {data.dateColumns.slice(0, 3).map((col, idx) => (
                      <th key={idx} className="p-2 text-left">{col.dateHeader}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sampleRows.map((row, idx) => (
                    <tr key={idx} className={idx === 0 ? 'bg-yellow-50 font-semibold' : 'border-t'}>
                      <td className="p-2">{row.rowIndex}</td>
                      {row.data.map((cell, cellIdx) => (
                        <td key={cellIdx} className="p-2 max-w-32 truncate">
                          {cell || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Debug Google Sheets Data</h1>
        <Button
          onClick={fetchAllData}
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
      ) : (
        <Tabs defaultValue="k15" className="space-y-4">
          <TabsList>
            <TabsTrigger value="k15">Khóa K15</TabsTrigger>
            <TabsTrigger value="k16">Khóa K16</TabsTrigger>
          </TabsList>
          
          <TabsContent value="k15">
            {k15Data ? (
              renderClassData(k15Data, 'K15')
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Không thể tải dữ liệu K15. Vui lòng kiểm tra kết nối.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="k16">
            {k16Data ? (
              renderClassData(k16Data, 'K16')
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Không thể tải dữ liệu K16. Vui lòng kiểm tra kết nối.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}