'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadSettlements } from '@/lib/api'
import toast from 'react-hot-toast'

interface UploadFormProps {
  onUploadSuccess?: () => void
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await uploadSettlements(formData)
      if (response.processed > 0) {
        toast.success(
          `Stored ${response.processed} settlement(s). Skipped: ${response.skipped}${
            response.errors.length ? `, Errors: ${response.errors.length}` : ''
          }`
        )
      } else if (response.skipped > 0 && response.errors.length === 0) {
        toast('All records were already uploaded earlier. Skipped as duplicates.')
      } else {
        toast.error('No records were stored. Please verify your file headers and values.')
      }
      setFile(null)
      onUploadSuccess?.()
    } catch (error: any) {
      const details = error?.details
      const topError = details?.errors?.[0]
      toast.error(topError || error?.message || 'Failed to upload file. Please try again.')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => setFile(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Upload Settlements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
            isDragActive
              ? 'border-lime-glow bg-lime-glow/5'
              : 'border-border hover:border-lime-glow/50 hover:bg-muted/50'
          )}
        >
          <input {...getInputProps()} />
          <Upload
            className={cn(
              'h-10 w-10 mb-4',
              isDragActive ? 'text-lime-glow' : 'text-muted-foreground'
            )}
          />
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">CSV or JSON files only</p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-warning-foreground">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-xs">Maximum 1000 rows per upload</p>
        </div>

        {file && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-lime-glow" />
              <div>
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={removeFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
