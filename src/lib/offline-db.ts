import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VocaDBSchema extends DBSchema {
  vocabulary: {
    key: string;
    value: {
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
    };
    indexes: {
      'by-synced': boolean;
      'by-created': string;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      action: 'add' | 'update' | 'delete';
      entity: 'vocabulary' | 'studySession';
      data: any;
      timestamp: number;
      retries: number;
    };
    indexes: {
      'by-timestamp': number;
    };
  };
  studySessions: {
    key: string;
    value: {
      id: string;
      startedAt: string;
      endedAt?: string;
      wordsStudied: number;
      correctAnswers: number;
      sessionType: string;
      synced: boolean;
    };
    indexes: {
      'by-synced': boolean;
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

        // Study sessions store
        if (!db.objectStoreNames.contains('studySessions')) {
          const sessionStore = db.createObjectStore('studySessions', { keyPath: 'id' });
          sessionStore.createIndex('by-synced', 'synced');
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
  async getVocabulary(userId: string): Promise<any[]> {
    const db = await this.ensureDB();
    const all = await db.getAll('vocabulary');
    // Filter by userId if we store it in the word data
    return all.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async addVocabularyWord(word: any): Promise<void> {
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

  async updateVocabularyWord(id: string, updates: any): Promise<void> {
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

  // Study session methods
  async addStudySession(session: any): Promise<void> {
    const db = await this.ensureDB();
    const sessionWithMeta = {
      ...session,
      synced: false
    };
    
    await db.put('studySessions', sessionWithMeta);
    
    // Add to sync queue
    await this.addToSyncQueue({
      action: 'add',
      entity: 'studySession',
      data: session
    });
  }

  async getUnsyncedStudySessions(): Promise<any[]> {
    const db = await this.ensureDB();
    const index = db.transaction('studySessions').store.index('by-synced');
    return index.getAll(false);
  }

  async markSessionsSynced(ids: string[]): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction('studySessions', 'readwrite');
    
    for (const id of ids) {
      const session = await tx.store.get(id);
      if (session) {
        session.synced = true;
        await tx.store.put(session);
      }
    }
    
    await tx.done;
  }

  // Sync queue methods
  async addToSyncQueue(item: {
    action: 'add' | 'update' | 'delete';
    entity: 'vocabulary' | 'studySession';
    data: any;
  }): Promise<void> {
    const db = await this.ensureDB();
    const queueItem = {
      id: `${Date.now()}_${Math.random()}`,
      ...item,
      timestamp: Date.now(),
      retries: 0
    };
    
    await db.add('syncQueue', queueItem);
  }

  async getSyncQueue(): Promise<any[]> {
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
    await db.clear('studySessions');
  }

  // Merge server data with local data
  async mergeServerData(serverData: any[]): Promise<void> {
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