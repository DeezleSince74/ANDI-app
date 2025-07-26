const { BlobServiceClient } = require('@azure/storage-blob');

const connectionString = "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://localhost:10000/devstoreaccount1;";
const containerName = 'andi-media';

async function testAzurite() {
  try {
    console.log('🔧 Testing Azurite connection...');
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    console.log('🔧 Creating container client...');
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    console.log('🔧 Attempting to create container...');
    const result = await containerClient.createIfNotExists({
      access: 'blob'
    });
    
    if (result.succeeded) {
      console.log('✅ Container created successfully');
    } else {
      console.log('✅ Container already exists');
    }
    
    console.log('🔧 Testing blob upload...');
    const testBlob = Buffer.from('test audio content');
    const blockBlobClient = containerClient.getBlockBlobClient('test-audio.txt');
    
    await blockBlobClient.upload(testBlob, testBlob.length, {
      blobHTTPHeaders: {
        blobContentType: 'text/plain',
      },
    });
    
    console.log('✅ Test blob uploaded successfully');
    console.log('✅ Azurite is working correctly!');
    
  } catch (error) {
    console.error('❌ Azurite test failed:', error);
    console.error('Error details:', error.message);
  }
}

testAzurite();