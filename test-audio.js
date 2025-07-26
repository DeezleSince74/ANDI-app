#!/usr/bin/env node

// Create a minimal test for Assembly AI upload
const { AssemblyAIService } = require('./app/web-app/src/services/ai/AssemblyAIService.ts');
const fs = require('fs');

async function testAssemblyAI() {
  console.log('🔄 Testing Assembly AI upload...');
  
  try {
    const apiKey = 'ec3e29e748504340acb9d50e6149ab6b';
    const service = new AssemblyAIService(apiKey);
    
    // Create a minimal test audio buffer (MP3 header)
    const testAudio = Buffer.from([
      0xFF, 0xFB, 0x92, 0x00, // MP3 header
      0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
    ]);
    
    console.log('📊 Test buffer size:', testAudio.length);
    
    const uploadUrl = await service.uploadAudio(testAudio, 'test.mp3');
    console.log('✅ Upload successful:', uploadUrl);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAssemblyAI();