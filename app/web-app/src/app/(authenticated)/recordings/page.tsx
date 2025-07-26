'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Mic, 
  Calendar,
  Clock,
  MoreHorizontal,
  Play,
  Download,
  Trash2,
  Eye,
  FileAudio
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow, format } from 'date-fns';

interface Recording {
  sessionId: string;
  displayName: string;
  createdAt: Date;
  duration: number; // in seconds
  sourceType: 'recorded' | 'uploaded';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingStage: 'pending' | 'uploading' | 'transcribing' | 'analyzing' | 'completed' | 'failed';
  processingProgress: number;
  ciqScore?: number;
}

// API response interface
interface RecordingsResponse {
  success: boolean;
  recordings: Recording[];
  total: number;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} hr ${minutes} mins`;
  }
  return `${minutes} mins`;
}

function getStatusBadge(recording: Recording) {
  if (recording.status === 'completed') {
    return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">Recorded</Badge>;
  }
  if (recording.status === 'processing') {
    return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
  }
  if (recording.status === 'failed') {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="outline">Pending</Badge>;
}

function getSourceIcon(sourceType: 'recorded' | 'uploaded') {
  return sourceType === 'recorded' ? 
    <Mic className="h-4 w-4 text-blue-600" /> : 
    <Upload className="h-4 w-4 text-green-600" />;
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        console.log('Fetching recordings from API...');
        const response = await fetch('/api/recordings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch recordings');
        }
        
        const data: RecordingsResponse = await response.json();
        console.log('Received recordings:', data);
        
        if (data.success) {
          // Convert date strings back to Date objects
          const recordingsWithDates = data.recordings.map(recording => ({
            ...recording,
            createdAt: new Date(recording.createdAt)
          }));
          setRecordings(recordingsWithDates);
        } else {
          console.error('API returned unsuccessful response');
          setRecordings([]);
        }
      } catch (error) {
        console.error('Failed to fetch recordings:', error);
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, []);

  const currentWeekRecordings = recordings.filter(recording => {
    const recordingDate = new Date(recording.createdAt);
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return recordingDate >= startOfWeek;
  });

  const lastWeekRecordings = recordings.filter(recording => {
    const recordingDate = new Date(recording.createdAt);
    const now = new Date();
    const startOfLastWeek = new Date(now.setDate(now.getDate() - now.getDay() - 7));
    const endOfLastWeek = new Date(now.setDate(now.getDate() - now.getDay() - 1));
    return recordingDate >= startOfLastWeek && recordingDate <= endOfLastWeek;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Recordings</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold tracking-tight">Recordings</h1>

      {/* This Week Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">This Week</h2>
          <span className="text-sm text-slate-500">
            Insights available on Sun, Mar 23
          </span>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Recording Name</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentWeekRecordings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No recordings this week
                  </TableCell>
                </TableRow>
              ) : (
                currentWeekRecordings.map((recording) => (
                  <TableRow key={recording.sessionId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <FileAudio className="h-4 w-4 text-slate-400" />
                        <span>{recording.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Calendar className="h-3 w-3" />
                        <span>{format(recording.createdAt, 'EEE, MMM dd')}</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{format(recording.createdAt, 'h:mm a')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {formatDuration(recording.duration)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getSourceIcon(recording.sourceType)}
                        {getStatusBadge(recording)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Analysis
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Play className="mr-2 h-4 w-4" />
                            Play Audio
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Last Week Section */}
      {lastWeekRecordings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Last Week</h2>
            <Button variant="outline" size="sm">
              View Insights →
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Recording Name</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastWeekRecordings.map((recording) => (
                  <TableRow key={recording.sessionId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <FileAudio className="h-4 w-4 text-slate-400" />
                        <span>{recording.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Calendar className="h-3 w-3" />
                        <span>{format(recording.createdAt, 'EEE, MMM dd')}</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{format(recording.createdAt, 'h:mm a')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {formatDuration(recording.duration)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getSourceIcon(recording.sourceType)}
                        {getStatusBadge(recording)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Analysis
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Play className="mr-2 h-4 w-4" />
                            Play Audio
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}