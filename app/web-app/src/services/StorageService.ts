/**
 * ANDI Recording Storage Service
 * Handles IndexedDB operations for classroom recordings
 */

export interface RecordingMetadata {
  id: string;
  teacherId: string;
  displayName: string; // User-provided name for the recording
  duration: number; // actual recording duration in seconds
  selectedDuration: number; // user-selected duration + buffer in seconds
  timestamp: string; // ISO string
  fileName: string;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed' | 'failed_permanently';
  retryCount: number;
  lastAttempt?: string;
  chunks?: Blob[]; // For chunked storage
  fileSize: number; // in bytes
}

export interface RecordingBlob {
  id: string;
  blob: Blob;
  timestamp: string;
}

class StorageService {
  private dbName = 'ANDIRecordings';
  private dbVersion = 1;
  private recordingsStore = 'andi-recordings';
  private blobsStore = 'recording-blobs';
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.setupDatabase(db);
      };
    });
  }

  /**
   * Set up database schema
   */
  private setupDatabase(db: IDBDatabase): void {
    // Create recordings metadata store
    if (!db.objectStoreNames.contains(this.recordingsStore)) {
      const recordingsStore = db.createObjectStore(this.recordingsStore, { 
        keyPath: 'id' 
      });
      
      // Create indexes for efficient querying
      recordingsStore.createIndex('teacherId', 'teacherId', { unique: false });
      recordingsStore.createIndex('uploadStatus', 'uploadStatus', { unique: false });
      recordingsStore.createIndex('timestamp', 'timestamp', { unique: false });
      recordingsStore.createIndex('retryCount', 'retryCount', { unique: false });
      
      console.log('Created recordings store with indexes');
    }

    // Create blobs store for large audio files
    if (!db.objectStoreNames.contains(this.blobsStore)) {
      const blobsStore = db.createObjectStore(this.blobsStore, { 
        keyPath: 'id' 
      });
      blobsStore.createIndex('timestamp', 'timestamp', { unique: false });
      
      console.log('Created recording blobs store');
    }
  }

  /**
   * Store a recording with its metadata and audio blob
   */
  async storeRecording(metadata: RecordingMetadata, audioBlob: Blob): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.recordingsStore, this.blobsStore], 'readwrite');
    
    try {
      // Store metadata
      const metadataStore = transaction.objectStore(this.recordingsStore);
      await this.promisifyRequest(metadataStore.add(metadata));

      // Store audio blob separately to handle large files efficiently
      const blobStore = transaction.objectStore(this.blobsStore);
      const blobData: RecordingBlob = {
        id: metadata.id,
        blob: audioBlob,
        timestamp: metadata.timestamp
      };
      await this.promisifyRequest(blobStore.add(blobData));

      console.log(`Recording stored successfully: ${metadata.id}`);
    } catch (error) {
      console.error('Failed to store recording:', error);
      throw error;
    }
  }

  /**
   * Store recording in chunks for very large files
   */
  async storeRecordingChunked(metadata: RecordingMetadata, chunks: Blob[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Store chunks in metadata for service worker access
    const metadataWithChunks = {
      ...metadata,
      chunks: chunks
    };

    const transaction = this.db.transaction([this.recordingsStore], 'readwrite');
    const store = transaction.objectStore(this.recordingsStore);
    
    try {
      await this.promisifyRequest(store.add(metadataWithChunks));
      console.log(`Chunked recording stored successfully: ${metadata.id}`);
    } catch (error) {
      console.error('Failed to store chunked recording:', error);
      throw error;
    }
  }

  /**
   * Get recording metadata by ID
   */
  async getRecordingMetadata(recordingId: string): Promise<RecordingMetadata | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.recordingsStore], 'readonly');
    const store = transaction.objectStore(this.recordingsStore);
    
    try {
      const result = await this.promisifyRequest(store.get(recordingId));
      return result || null;
    } catch (error) {
      console.error('Failed to get recording metadata:', error);
      return null;
    }
  }

  /**
   * Get recording blob by ID
   */
  async getRecordingBlob(recordingId: string): Promise<Blob | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.blobsStore], 'readonly');
    const store = transaction.objectStore(this.blobsStore);
    
    try {
      const result = await this.promisifyRequest(store.get(recordingId));
      return result ? result.blob : null;
    } catch (error) {
      console.error('Failed to get recording blob:', error);
      return null;
    }
  }

  /**
   * Get all recordings for a specific teacher
   */
  async getTeacherRecordings(teacherId: string): Promise<RecordingMetadata[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.recordingsStore], 'readonly');
    const store = transaction.objectStore(this.recordingsStore);
    const index = store.index('teacherId');
    
    try {
      const result = await this.promisifyRequest(index.getAll(teacherId));
      return result || [];
    } catch (error) {
      console.error('Failed to get teacher recordings:', error);
      return [];
    }
  }

  /**
   * Get recordings by upload status
   */
  async getRecordingsByStatus(status: RecordingMetadata['uploadStatus']): Promise<RecordingMetadata[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.recordingsStore], 'readonly');
    const store = transaction.objectStore(this.recordingsStore);
    const index = store.index('uploadStatus');
    
    try {
      const result = await this.promisifyRequest(index.getAll(status));
      return result || [];
    } catch (error) {
      console.error('Failed to get recordings by status:', error);
      return [];
    }
  }

  /**
   * Update recording metadata
   */
  async updateRecordingMetadata(recordingId: string, updates: Partial<RecordingMetadata>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.recordingsStore], 'readwrite');
    const store = transaction.objectStore(this.recordingsStore);
    
    try {
      const existing = await this.promisifyRequest(store.get(recordingId));
      if (!existing) {
        throw new Error(`Recording not found: ${recordingId}`);
      }

      const updated = { ...existing, ...updates };
      await this.promisifyRequest(store.put(updated));
      console.log(`Recording metadata updated: ${recordingId}`);
    } catch (error) {
      console.error('Failed to update recording metadata:', error);
      throw error;
    }
  }

  /**
   * Delete a recording and its blob
   */
  async deleteRecording(recordingId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.recordingsStore, this.blobsStore], 'readwrite');
    
    try {
      // Delete metadata
      const metadataStore = transaction.objectStore(this.recordingsStore);
      await this.promisifyRequest(metadataStore.delete(recordingId));

      // Delete blob
      const blobStore = transaction.objectStore(this.blobsStore);
      await this.promisifyRequest(blobStore.delete(recordingId));

      console.log(`Recording deleted: ${recordingId}`);
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw error;
    }
  }

  /**
   * Clean up completed uploads older than specified days
   */
  async cleanupOldRecordings(daysOld: number = 7): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffTimestamp = cutoffDate.toISOString();

    const transaction = this.db.transaction([this.recordingsStore, this.blobsStore], 'readwrite');
    const recordingsStore = transaction.objectStore(this.recordingsStore);
    const statusIndex = recordingsStore.index('uploadStatus');
    
    try {
      // Get completed recordings
      const completedRecordings = await this.promisifyRequest(statusIndex.getAll('completed'));
      
      let deletedCount = 0;
      for (const recording of completedRecordings) {
        if (recording.timestamp < cutoffTimestamp) {
          await this.deleteRecording(recording.id);
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} old recordings`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old recordings:', error);
      return 0;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalRecordings: number;
    pendingUploads: number;
    failedUploads: number;
    completedUploads: number;
    estimatedSize: number;
  }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.recordingsStore], 'readonly');
    const store = transaction.objectStore(this.recordingsStore);
    
    try {
      const allRecordings = await this.promisifyRequest(store.getAll());
      
      const stats = {
        totalRecordings: allRecordings.length,
        pendingUploads: 0,
        failedUploads: 0,
        completedUploads: 0,
        estimatedSize: 0
      };

      for (const recording of allRecordings) {
        stats.estimatedSize += recording.fileSize || 0;
        
        switch (recording.uploadStatus) {
          case 'pending':
          case 'uploading':
            stats.pendingUploads++;
            break;
          case 'failed':
          case 'failed_permanently':
            stats.failedUploads++;
            break;
          case 'completed':
            stats.completedUploads++;
            break;
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalRecordings: 0,
        pendingUploads: 0,
        failedUploads: 0,
        completedUploads: 0,
        estimatedSize: 0
      };
    }
  }

  /**
   * Check if storage quota is approaching limits
   */
  async checkStorageQuota(): Promise<{
    usage: number;
    quota: number;
    percentUsed: number;
    warningLevel: 'safe' | 'warning' | 'critical';
  }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
        
        let warningLevel: 'safe' | 'warning' | 'critical' = 'safe';
        if (percentUsed > 90) {
          warningLevel = 'critical';
        } else if (percentUsed > 75) {
          warningLevel = 'warning';
        }

        return { usage, quota, percentUsed, warningLevel };
      }
    } catch (error) {
      console.error('Failed to check storage quota:', error);
    }

    return {
      usage: 0,
      quota: 0,
      percentUsed: 0,
      warningLevel: 'safe'
    };
  }

  /**
   * Convert IDBRequest to Promise
   */
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();