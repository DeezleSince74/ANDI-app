import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'andi-media';

    if (!connectionString) {
      throw new Error('Azure Storage connection string not configured');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerName = containerName;
  }

  /**
   * Initialize storage by creating container if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      await containerClient.createIfNotExists({
        access: 'blob' // Allow public read access to blobs
      });
      console.log(`✅ Azure Storage container '${this.containerName}' ready`);
    } catch (error) {
      console.error('❌ Failed to initialize Azure Storage:', error);
      throw error;
    }
  }

  /**
   * Upload a buffer to Azure Blob Storage
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    subfolder?: string
  ): Promise<string> {
    try {
      await this.initialize();

      const blobName = subfolder ? `${subfolder}/${fileName}` : fileName;
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
          blobCacheControl: 'public, max-age=31536000', // 1 year cache
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalFileName: fileName,
        }
      });

      const blobUrl = blockBlobClient.url;
      console.log(`✅ File uploaded successfully: ${blobName}`);
      
      return blobUrl;
    } catch (error) {
      console.error('❌ Failed to upload to Azure Storage:', error);
      throw error;
    }
  }

  /**
   * Upload a file from local path to Azure Blob Storage
   */
  async uploadFile(
    filePath: string,
    fileName: string,
    contentType: string,
    subfolder?: string
  ): Promise<string> {
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    return this.uploadBuffer(buffer, fileName, contentType, subfolder);
  }

  /**
   * Delete a blob from Azure Storage
   */
  async deleteBlob(blobName: string): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.deleteIfExists();
      console.log(`✅ File deleted successfully: ${blobName}`);
    } catch (error) {
      console.error('❌ Failed to delete from Azure Storage:', error);
      throw error;
    }
  }

  /**
   * Get a blob's metadata and properties
   */
  async getBlobInfo(blobName: string) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      const properties = await blockBlobClient.getProperties();
      return {
        url: blockBlobClient.url,
        contentType: properties.contentType,
        contentLength: properties.contentLength,
        lastModified: properties.lastModified,
        metadata: properties.metadata,
      };
    } catch (error) {
      console.error('❌ Failed to get blob info:', error);
      throw error;
    }
  }

  /**
   * Generate a public URL for a blob
   */
  getBlobUrl(blobName: string): string {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
  }

  /**
   * List blobs in a container with optional prefix
   */
  async listBlobs(prefix?: string) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobs = [];
      
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        blobs.push({
          name: blob.name,
          url: this.getBlobUrl(blob.name),
          properties: blob.properties,
        });
      }
      
      return blobs;
    } catch (error) {
      console.error('❌ Failed to list blobs:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const azureStorage = new AzureStorageService();