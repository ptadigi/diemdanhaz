'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Sync, 
  Database, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface SyncStatus {
  totalRecords: number
  syncedRecords: number
  pendingRecords: number
  errorRecords: number
  sessionSyncStatus: string
  lastSyncAt?: string
}

interface GoogleSheetsSyncProps {
  sessionId: string
  sessionTitle: string
}

export default function GoogleSheetsSync({ sessionId, sessionTitle }: GoogleSheetsSyncProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch sync status on mount
  useEffect(() => {
    if (sessionId) {
      fetchSyncStatus()
    }
  }, [sessionId])

  const fetchSyncStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/sync?sessionId=${sessionId}`)
      const data = await response.json()
      
      if (data.success) {
        setSyncStatus(data.stats)
      } else {
        console.error('Failed to fetch sync status:', data.error)
      }
    } catch (error) {
      console.error('Error fetching sync status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const syncFromGoogleSheets = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          direction: 'from-google-sheets'
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Đồng bộ thành công! ${data.syncedCount}/${data.totalRecords} bản ghi`)
        fetchSyncStatus()
      } else {
        toast.error(data.error || 'Đồng bộ thất bại')
      }
    } catch (error) {
      toast.error('Lỗi kết nối')
    } finally {
      setIsSyncing(false)
    }
  }

  const syncToGoogleSheets = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          direction: 'to-google-sheets'
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Đã đẩy ${data.syncedCount} bản ghi lên Google Sheets`)
        fetchSyncStatus()
      } else {
        toast.error(data.error || 'Đồng bộ thất bại')
      }
    } catch (error) {
      toast.error('Lỗi kết nối')
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-100 text-green-800'
      case 'syncing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'synced': return 'Đã đồng bộ'
      case 'syncing': return 'Đang đồng bộ'
      case 'pending': return 'Chờ đồng bộ'
      case 'error': return 'Lỗi đồng bộ'
      default: return 'Không xác định'
    }
  }

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Chưa đồng bộ'
    return new Date(dateString).toLocaleString('vi-VN')
  }

  if (!syncStatus && isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Đang tải trạng thái đồng bộ...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Đồng bộ Google Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Thông tin trạng thái */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Database:</span>
            <Badge variant="outline">
              {syncStatus?.totalRecords || 0} bản ghi
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span className="text-sm">Google Sheets:</span>
            <Badge variant="outline">
              {syncStatus?.syncedRecords || 0} đã sync
            </Badge>
          </div>
        </div>

        {/* Trạng thái đồng bộ */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(syncStatus?.sessionSyncStatus || 'pending')}>
              {getStatusText(syncStatus?.sessionSyncStatus || 'pending')}
            </Badge>
            <span className="text-sm text-gray-600">
              Lần cuối: {formatLastSync(syncStatus?.lastSyncAt)}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSyncStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Thống kê chi tiết */}
        {syncStatus && (syncStatus.pendingRecords > 0 || syncStatus.errorRecords > 0) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {syncStatus.pendingRecords > 0 && (
                <span className="text-yellow-600">
                  {syncStatus.pendingRecords} bản ghi đang chờ đồng bộ. 
                </span>
              )}
              {syncStatus.errorRecords > 0 && (
                <span className="text-red-600">
                  {syncStatus.errorRecords} bản ghi đồng bộ lỗi.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Các hành động đồng bộ */}
        <div className="flex gap-2">
          <Button
            onClick={syncFromGoogleSheets}
            disabled={isSyncing || !sessionId}
            className="flex-1"
            variant="outline"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Lấy từ Google Sheets
          </Button>
          <Button
            onClick={syncToGoogleSheets}
            disabled={isSyncing || !sessionId}
            className="flex-1"
            variant="outline"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Đẩy lên Google Sheets
          </Button>
        </div>

        {/* Ghi chú */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Google Sheets là cơ sở dữ liệu chính của hệ thống</p>
          <p>• "Lấy từ Google Sheets": Tải danh sách học viên từ sheet xuống</p>
          <p>• "Đẩy lên Google Sheets": Cập nhật dữ liệu điểm danh lên sheet</p>
          <p>• Spreadsheet ID: 1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM</p>
        </div>
      </CardContent>
    </Card>
  )
}