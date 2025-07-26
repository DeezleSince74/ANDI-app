'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Upload, Edit3, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface RecordingNameFormProps {
  mode: 'record' | 'upload';
  defaultName?: string;
  onNameChange?: (name: string) => void;
  onStartRecording?: () => void;
  onFileSelect?: (file: File) => void;
  className?: string;
  isLoading?: boolean;
}

export function RecordingNameForm({
  mode,
  defaultName,
  onNameChange,
  onStartRecording,
  onFileSelect,
  className = '',
  isLoading = false
}: RecordingNameFormProps) {
  const [recordingName, setRecordingName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Generate default recording name based on current time
  const generateDefaultName = (): string => {
    const now = new Date();
    const weekNumber = Math.ceil(
      (now.getDate() - now.getDay() + 7) / 7
    );
    const dayName = format(now, 'EEEE');
    
    // Count how many recordings today (simulated - in real app would query DB)
    const todaySessionCount = 1; // This would come from your recording count logic
    
    return `Recording ${weekNumber} - ${dayName} Session ${todaySessionCount}`;
  };

  useEffect(() => {
    if (!recordingName && !defaultName) {
      const name = generateDefaultName();
      setRecordingName(name);
      onNameChange?.(name);
    } else if (defaultName && !recordingName) {
      setRecordingName(defaultName);
      onNameChange?.(defaultName);
    }
  }, [defaultName, recordingName, onNameChange]);

  const handleNameChange = (newName: string) => {
    setRecordingName(newName);
    onNameChange?.(newName);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect?.(file);
      
      // Auto-generate name based on file if recording name is still default
      if (recordingName === generateDefaultName()) {
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        const cleanName = fileName.replace(/[-_]/g, ' '); // Replace dashes/underscores with spaces
        handleNameChange(cleanName);
      }
    }
  };

  const handleSubmit = () => {
    if (mode === 'record') {
      onStartRecording?.();
    }
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          {mode === 'record' ? (
            <>
              <Mic className="h-5 w-5 text-blue-600" />
              <span>New Recording</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-green-600" />
              <span>Upload Recording</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Name Input */}
        <div className="space-y-2">
          <Label htmlFor="recording-name">Recording Name</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="recording-name"
              value={recordingName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter recording name..."
              disabled={!isEditingName && recordingName.length > 0}
              className={!isEditingName ? 'bg-slate-50' : ''}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingName(!isEditingName)}
              className="p-2"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
          {!isEditingName && (
            <p className="text-xs text-slate-500">
              Click the edit icon to customize the name
            </p>
          )}
        </div>

        {/* Current Time Display */}
        <div className="flex items-center justify-center space-x-4 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(), 'EEE, MMM dd')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{format(new Date(), 'h:mm a')}</span>
          </div>
        </div>

        {/* File Upload (for upload mode) */}
        {mode === 'upload' && (
          <div className="space-y-2">
            <Label htmlFor="audio-file">Select Audio File</Label>
            <Input
              id="audio-file"
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac"
              onChange={handleFileSelect}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <div className="text-sm text-slate-600 bg-green-50 border border-green-200 rounded-lg p-2">
                <strong>Selected:</strong> {selectedFile.name}
                <br />
                <strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleSubmit}
          disabled={
            isLoading || 
            !recordingName.trim() || 
            (mode === 'upload' && !selectedFile)
          }
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>
                {mode === 'record' ? 'Starting...' : 'Uploading...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {mode === 'record' ? (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Start Recording</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload & Process</span>
                </>
              )}
            </div>
          )}
        </Button>

        {/* Helper Text */}
        <div className="text-xs text-slate-500 text-center space-y-1">
          {mode === 'record' ? (
            <>
              <p>Recording will begin once you click "Start Recording"</p>
              <p>Make sure your microphone is working properly</p>
            </>
          ) : (
            <>
              <p>Supported formats: MP3, WAV, M4A, AAC</p>
              <p>Maximum file size: 500MB</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RecordingNameForm;