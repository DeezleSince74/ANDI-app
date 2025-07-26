#!/usr/bin/env node

// Simple test script to check upload API
const fs = require('fs');

async function testUpload() {
  try {
    console.log('🔄 Testing upload API...');
    
    // Create a small test audio file
    const testContent = Buffer.from('test audio content');
    
    const formData = new FormData();
    const file = new File([testContent], 'test.mp3', { type: 'audio/mp3' });
    
    formData.append('audio', file);
    formData.append('teacherId', 'test-user');
    formData.append('recordingId', 'test-123');
    formData.append('timestamp', new Date().toISOString());
    formData.append('duration', '0');
    formData.append('selectedDuration', '0');
    
    const response = await fetch('http://localhost:3000/api/recordings/upload', {
      method: 'POST',
      body: formData,
    });
    
    const text = await response.text();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('📊 Response body:', text);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUpload();