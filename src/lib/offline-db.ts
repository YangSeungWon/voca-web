import { openDB, IDBPDatabase } from 'idb';

export interface VocabularyItem {
  id: string;
  word: {
    word: string;
    pronunciation?: string;
    definitions: Array<{
      partOfSpeech?: string;
      meaning: string;
    }>;
  };
  level: number;
  reviewCount: number;
  correctCount: number;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  groupId?: string;
  notes?: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'add' | 'update' | 'delete';
  entity: 'vocabulary';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}


interface VocaDBSchema {
  vocabulary: {
    key: string;
    value: VocabularyItem;
    indexes: {
      'by-synced': boolean;
      'by-created': string;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-timestamp': number;
    };
  };
}

class OfflineDB {
  private db: IDBPDatabase<VocaDBSchema> | null = null;
  private readonly DB_NAME = 'voca-web-offline';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    this.db = await openDB<VocaDBSchema>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Vocabulary store
        if (!db.objectStoreNames.contains('vocabulary')) {
          const vocabStore = db.createObjectStore('vocabulary', { keyPath: 'id' });
          vocabStore.createIndex('by-synced', 'synced');
          vocabStore.createIndex('by-created', 'createdAt');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-timestamp', 'timestamp');
        }

      }
    });
  }

  private async ensureDB(): Promise<IDBPDatabase<VocaDBSchema>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Vocabulary methods
  async getVocabulary(_userId: string): Promise<VocabularyItem[]> {
    const db = await this.ensureDB();
    const all = await db.getAll('vocabulary');
    // Filter by userId if we store it in the word data
    return all.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async addVocabularyWord(word: Omit<VocabularyItem, 'synced' | 'updatedAt'> & Partial<Pick<VocabularyItem, 'synced' | 'updatedAt'>>): Promise<void> {
    const db = await this.ensureDB();
    const wordWithMeta = {
      ...word,
      synced: false,
      createdAt: word.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.put('vocabulary', wordWithMeta);
    
    // Add to sync queue
    await this.addToSyncQueue({
      action: 'add',
      entity: 'vocabulary',
      data: word
    });
  }

  async updateVocabularyWord(id: string, updates: Partial<VocabularyItem>): Promise<void> {
    const db = await this.ensureDB();
    const existing = await db.get('vocabulary', id);
    
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        synced: false,
        updatedAt: new Date().toISOString()
      };
      
      await db.put('vocabulary', updated);
      
      // Add to sync queue
      await this.addToSyncQueue({
        action: 'update',
        entity: 'vocabulary',
        data: { id, ...updates }
      });
    }
  }

  async deleteVocabularyWord(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('vocabulary', id);
    
    // Add to sync queue
    await this.addToSyncQueue({
      action: 'delete',
      entity: 'vocabulary',
      data: { id }
    });
  }

  async markVocabularySynced(ids: string[]): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction('vocabulary', 'readwrite');
    
    for (const id of ids) {
      const word = await tx.store.get(id);
      if (word) {
        word.synced = true;
        await tx.store.put(word);
      }
    }
    
    await tx.done;
  }


  // Sync queue methods
  async addToSyncQueue(item: {
    action: 'add' | 'update' | 'delete';
    entity: 'vocabulary';
    data: Record<string, unknown>;
  }): Promise<void> {
    const db = await this.ensureDB();
    // Use crypto for secure random ID
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    const randomStr = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const queueItem = {
      id: `${Date.now()}_${randomStr}`,
      ...item,
      timestamp: Date.now(),
      retries: 0
    };
    
    await db.add('syncQueue', queueItem);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.ensureDB();
    const index = db.transaction('syncQueue').store.index('by-timestamp');
    return index.getAll();
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('syncQueue', id);
  }

  async incrementSyncRetries(id: string): Promise<void> {
    const db = await this.ensureDB();
    const item = await db.get('syncQueue', id);
    
    if (item) {
      item.retries += 1;
      await db.put('syncQueue', item);
    }
  }

  // Clear all data
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    await db.clear('vocabulary');
    await db.clear('syncQueue');
  }

  // Merge server data with local data
  async mergeServerData(serverData: VocabularyItem[]): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction('vocabulary', 'readwrite');
    
    for (const item of serverData) {
      const existing = await tx.store.get(item.id);
      
      // Server data takes precedence, but preserve local unsynced changes
      if (!existing || existing.synced) {
        await tx.store.put({
          ...item,
          synced: true
        });
      }
    }
    
    await tx.done;
  }
}

// Singleton instance
const offlineDB = new OfflineDB();
export default offlineDB;