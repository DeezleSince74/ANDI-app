'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileAudio, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
}

export function UploadModal({ isOpen, onClose, teacherId }: UploadModalProps) {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const supportedFormats = ['MP3', 'MP4', 'M4A', 'FLAC', 'WAV', 'WMA', 'AAC'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'audio/mp3',
        'audio/mpeg',
        'audio/mp4',
        'audio/m4a',
        'audio/x-m4a',
        'audio/mp4a-latm',
        'audio/flac',
        'audio/wav',
        'audio/x-wav',
        'audio/wave',
        'audio/vnd.wav',
        'audio/x-ms-wma',
        'audio/aac',
        'audio/webm',
        'audio/ogg'
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('Unsupported file format. Please select an audio file.');
        return;
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        setError('File too large. Maximum size is 100MB.');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Create a synthetic event to reuse the file selection logic
      const syntheticEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(syntheticEvent);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('teacherId', teacherId);
      formData.append('timestamp', new Date().toISOString());
      formData.append('recordingId', `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      formData.append('duration', '0'); // Unknown duration for uploads
      formData.append('selectedDuration', '0'); // Not applicable for uploads

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await fetch('/api/recordings/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('=== UPLOAD API RESPONSE ===', result); // Debug log
      
      setUploadProgress(100);
      setUploadState('success');
      
      toast.success('Recording uploaded successfully!', {
        duration: 3000,
      });

      // Auto-close and redirect to processing status
      setTimeout(() => {
        onClose();
        resetModal();
        
        // Redirect to processing status page if we have a sessionId
        if (result.sessionId) {
          const url = result.transcriptId 
            ? `/processing/${result.sessionId}?transcriptId=${result.transcriptId}`
            : `/processing/${result.sessionId}`;
          console.log('Redirecting to:', url); // Debug log
          window.location.href = url;
        } else {
          console.log('No sessionId in response, not redirecting'); // Debug log
        }
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      setUploadState('error');
      
      toast.error('Upload failed. Please try again.', {
        duration: 5000,
      });
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (uploadState !== 'uploading') {
      onClose();
      resetModal();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Upload Recording</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={uploadState === 'uploading'}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {uploadState === 'idle' && (
            <>
              {/* File Drop Zone */}
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-1">
                  <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                    Choose file
                  </span>{' '}
                  or drag and drop here
                </p>
                <p className="text-xs text-slate-500">
                  Supported formats: {supportedFormats.join(', ')}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile && (
                <div className="bg-slate-50 rounded-lg p-3 border">
                  <div className="flex items-center gap-3">
                    <FileAudio className="h-5 w-5 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="h-6 w-6 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {uploadState === 'uploading' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 border">
                <div className="flex items-center gap-3">
                  <FileAudio className="h-5 w-5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedFile && formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {uploadState === 'success' && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Upload Complete!
              </h3>
              <p className="text-sm text-slate-600">
                Your recording has been uploaded successfully and will be processed shortly.
              </p>
            </div>
          )}

          {uploadState === 'error' && (
            <div className="text-center py-4">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Upload Failed
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                {error || 'Something went wrong. Please try again.'}
              </p>
              <Button
                onClick={() => {
                  setUploadState('idle');
                  setError(null);
                }}
                size="sm"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          {uploadState === 'idle' && (
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="flex-1"
              >
                Upload
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default UploadModal;