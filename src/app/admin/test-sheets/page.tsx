'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  TestTube, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  Settings,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TestResult {
  success: boolean
  message: string
  data?: any
  timestamp: string
}

export default function TestSheetsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [studentName, setStudentName] = useState('MOLOM QUỐC')
  const [khoa, setKhoa] = useState('K15')
  const [connectionTested, setConnectionTested] = useState(false)

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev].slice(0, 10)) // Keep only last 10 results
  }

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-sheets?testConnection=true&khoa=' + khoa)
      const result = await response.json()
      
      const testResult: TestResult = {
        success: result.success,
        message: result.success ? '✅ Kết nối Google Sheets API thành công!' : '❌ Kết nối thất bại',
        data: result,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      }
      
      addTestResult(testResult)
      setConnectionTested(result.success)
      
      if (result.success) {
        toast.success('Kết nối Google Sheets API thành công!')
      } else {
        toast.error('Kết nối Google Sheets API thất bại!')
      }
    } catch (error) {
      const testResult: TestResult = {
        success: false,
        message: `❌ Lỗi: ${(error as Error).message}`,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      }
      addTestResult(testResult)
      toast.error('Lỗi khi test kết nối!')
    } finally {
      setIsLoading(false)
    }
  }

  const testReadData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/test-sheets?khoa=${khoa}&testName=${encodeURIComponent(studentName)}`)
      const result = await response.json()
      
      const testResult: TestResult = {
        success: result.success,
        message: result.success 
          ? `✅ Đọc dữ liệu thành công! Tìm thấy ${result.data.totalStudents} học viên` 
          : '❌ Đọc dữ liệu thất bại',
        data: result,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      }
      
      addTestResult(testResult)
      
      if (result.success) {
        toast.success('Đọc dữ liệu thành công!')
      } else {
        toast.error('Đọc dữ liệu thất bại!')
      }
    } catch (error) {
      const testResult: TestResult = {
        success: false,
        message: `❌ Lỗi: ${(error as Error).message}`,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      }
      addTestResult(testResult)
      toast.error('Lỗi khi đọc dữ liệu!')
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectWrite = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test-direct-write',
          studentName: studentName,
          khoa: khoa
        })
      })
      const result = await response.json()
      
      const testResult: TestResult = {
        success: result.success,
        message: result.success 
          ? `✅ Ghi trực tiếp thành công! ${result.message}` 
          : `❌ Ghi trực tiếp thất bại: ${result.message}`,
        data: result,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      }
      
      addTestResult(testResult)
      
      if (result.success) {
        toast.success('Ghi trực tiếp vào Google Sheets thành công!')
      } else {
        toast.error('Ghi trực tiếp thất bại!')
      }
    } catch (error) {
      const testResult: TestResult = {
        success: false,
        message: `❌ Lỗi: ${(error as Error).message}`,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      }
      addTestResult(testResult)
      toast.error('Lỗi khi ghi trực tiếp!')
    } finally {
      setIsLoading(false)
    }
  }

  const testAutoWrite = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test-auto-write',
          studentName: studentName,
          khoa: khoa
        })
      })
      const result = await response.json()
      
      const testResult: TestResult = {
        success: result.success,
        message: result.success 
          ? `✅ Ghi tự động thành công! ${result.message}` 
          : `❌ Ghi tự động thất bại: ${result.message}`,
        data: result,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      }
      
      addTestResult(testResult)
      
      if (result.success) {
        toast.success('Ghi tự động vào Google Sheets thành công!')
      } else {
        toast.error('Ghi tự động thất bại!')
      }
    } catch (error) {
      const testResult: TestResult = {
        success: false,
        message: `❌ Lỗi: ${(error as Error).message}`,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      }
      addTestResult(testResult)
      toast.error('Lỗi khi ghi tự động!')
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
    setConnectionTested(false)
    toast.info('Đã xóa kết quả test!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
              <h1 className="text-3xl font-bold text-slate-800">
                Test Google Sheets API
              </h1>
            </div>
            <p className="text-slate-600">
              Kiểm tra kết nối và thao tác với Google Sheets API
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Bảng điều khiển
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Configuration */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Tên học viên test
                    </label>
                    <Input
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Nhập tên học viên"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Khóa học
                    </label>
                    <Select value={khoa} onValueChange={setKhoa}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="K15">K15</SelectItem>
                        <SelectItem value="K16">K16</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium">Trạng thái kết nối:</span>
                  <Badge variant={connectionTested ? "default" : "secondary"}>
                    {connectionTested ? "Đã kết nối" : "Chưa test"}
                  </Badge>
                </div>

                {/* Test Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={testConnection}
                    disabled={isLoading}
                    className="w-full"
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4 mr-2" />
                    )}
                    Test Kết nối Google Sheets API
                  </Button>

                  <Button
                    onClick={testReadData}
                    disabled={isLoading || !connectionTested}
                    className="w-full"
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4 mr-2" />
                    )}
                    Test Đọc dữ liệu
                  </Button>

                  <Button
                    onClick={testDirectWrite}
                    disabled={isLoading || !connectionTested}
                    className="w-full"
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    Test Ghi trực tiếp
                  </Button>

                  <Button
                    onClick={testAutoWrite}
                    disabled={isLoading || !connectionTested}
                    className="w-full"
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Test Ghi tự động
                  </Button>
                </div>

                <Button
                  onClick={clearResults}
                  disabled={isLoading}
                  className="w-full"
                  variant="ghost"
                  size="sm"
                >
                  Xóa kết quả
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Kết quả test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      Chưa có kết quả test nào
                    </div>
                  ) : (
                    testResults.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                          <div className="flex items-start gap-2">
                            {result.success ? (
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <AlertDescription className="text-sm">
                                <div className="font-medium">{result.message}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {result.timestamp}
                                </div>
                              </AlertDescription>
                            </div>
                          </div>
                        </Alert>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Hướng dẫn sử dụng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-600 space-y-2">
                <p>1. <strong>Test Kết nối:</strong> Kiểm tra kết nối với Google Sheets API sử dụng Service Account</p>
                <p>2. <strong>Test Đọc dữ liệu:</strong> Đọc thông tin học viên từ Google Sheets</p>
                <p>3. <strong>Test Ghi trực tiếp:</strong> Ghi giá trị TRUE vào ô cụ thể (cần cung cấp cột ngày)</p>
                <p>4. <strong>Test Ghi tự động:</strong> Tự động tìm cột ngày hôm nay và ghi điểm danh</p>
              </div>
              
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Lưu ý:</strong> Đảm bảo đã cấu hình đúng Service Account credentials trong file .env
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}