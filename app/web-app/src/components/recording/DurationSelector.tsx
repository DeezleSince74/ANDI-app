'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Play } from 'lucide-react';

export interface DurationOption {
  minutes: number;
  label: string;
  totalMinutes: number; // includes 5-minute buffer
}

export interface DurationSelectorProps {
  onDurationSelected: (duration: number) => void;
  onStartRecording: (duration: number) => void;
  disabled?: boolean;
  selectedDuration?: number;
}

const DURATION_OPTIONS: DurationOption[] = [
  {
    minutes: 30,
    label: '30 min',
    totalMinutes: 35
  },
  {
    minutes: 45,
    label: '45 min',
    totalMinutes: 50
  },
  {
    minutes: 60,
    label: '60 min',
    totalMinutes: 65
  },
  {
    minutes: 90,
    label: '90 min',
    totalMinutes: 95
  }
];

export function DurationSelector({
  onDurationSelected,
  onStartRecording,
  disabled = false,
  selectedDuration
}: DurationSelectorProps) {
  const [selected, setSelected] = useState<number | null>(selectedDuration || null);

  const handleDurationClick = (duration: number) => {
    setSelected(duration);
    onDurationSelected(duration);
  };

  const handleStartRecording = () => {
    if (selected) {
      onStartRecording(selected);
    }
  };

  const selectedOption = DURATION_OPTIONS.find(option => option.minutes === selected);

  return (
    <Card className="w-full max-w-2xl mx-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-slate-800">
          <Clock className="h-5 w-5" />
          Select Class Duration
        </CardTitle>
        <CardDescription className="text-slate-600">
          Choose your expected class length. We&apos;ll automatically add a 5-minute buffer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duration Selection Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DURATION_OPTIONS.map((option) => (
            <Button
              key={option.minutes}
              variant={selected === option.minutes ? 'default' : 'outline'}
              className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all ${
                selected === option.minutes
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg scale-105'
                  : 'bg-background border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
              onClick={() => handleDurationClick(option.minutes)}
              disabled={disabled}
            >
              <span className="text-lg font-semibold">{option.label}</span>
              <span className="text-xs opacity-75">+5 min</span>
            </Button>
          ))}
        </div>

        {/* Selected Duration Summary */}
        {selectedOption && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">
                  Selected Duration: {selectedOption.label}
                </p>
                <p className="text-sm text-slate-600">
                  Total recording time: <span className="font-semibold">{selectedOption.totalMinutes} minutes</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  {selectedOption.totalMinutes}
                </div>
                <div className="text-xs text-slate-500">minutes</div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Class time:</span>
                <span className="font-medium text-slate-800">{selectedOption.minutes} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Safety buffer:</span>
                <span className="font-medium text-green-600">+5 min</span>
              </div>
            </div>
          </div>
        )}

        {/* Start Recording Button */}
        <Button
          onClick={handleStartRecording}
          disabled={!selected || disabled}
          size="lg"
          className={`w-full h-14 text-lg font-semibold transition-all ${
            selected && !disabled
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Play className="h-5 w-5 mr-2" />
          {selected 
            ? `Start ${selectedOption?.totalMinutes}-Minute Recording`
            : 'Select Duration to Start'
          }
        </Button>

        {/* Recording Info */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">📱 Recording Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Keep your device nearby for best audio quality</li>
            <li>• Recording continues even if you switch browser tabs</li>
            <li>• Your recording is saved locally and uploaded after class</li>
            <li>• You&apos;ll receive warnings at 5 and 1 minute remaining</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default DurationSelector;