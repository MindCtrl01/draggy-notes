# 🖥️ Server-Side Implementation Guide for Enhanced Sync System

This guide outlines the server-side changes and implementations required to support the enhanced client-side sync system with queue management, batch operations, and retry mechanisms.

## 📋 **Prerequisites**

- Existing REST API for notes CRUD operations
- User authentication system
- Database with notes table
- Basic error handling and logging

## 🎯 **Required Server-Side Features**

### **1. Enhanced API Endpoints**

#### **A. Batch Operations Support**

**Batch Create Notes**
```http
POST /api/notes/batch
Content-Type: application/json
Authorization: Bearer {token}

{
  "notes": [
    {
      "title": "Note 1",
      "content": "Content 1",
      "date": "2024-01-01T00:00:00Z",
      "color": "#ffeb3b",
      "position": { "x": 100, "y": 200 },
      "isDisplayed": true,
      "isPinned": false,
      "isTaskMode": false,
      "noteTasks": [],
      "tagNames": ["tag1", "tag2"]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "uuid": "generated-uuid",
      "title": "Note 1",
      "content": "Content 1",
      "date": "2024-01-01T00:00:00Z",
      "color": "#ffeb3b",
      "position": { "x": 100, "y": 200 },
      "isDisplayed": true,
      "isPinned": false,
      "isTaskMode": false,
      "tasks": [],
      "tags": [
        { "id": 1, "name": "tag1", "color": "#blue" },
        { "id": 2, "name": "tag2", "color": "#green" }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "errors": []
}
```

**Batch Update Notes**
```http
PUT /api/notes/batch
Content-Type: application/json
Authorization: Bearer {token}

{
  "notes": [
    {
      "id": 123,
      "title": "Updated Note 1",
      "content": "Updated Content 1",
      // ... other fields
    }
  ]
}
```

**Batch Delete Notes**
```http
DELETE /api/notes/batch
Content-Type: application/json
Authorization: Bearer {token}

{
  "noteIds": [123, 124, 125]
}
```

#### **B. Health Check Endpoint**

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "cache": "healthy"
  }
}
```

### **2. Database Schema Enhancements**

#### **A. Add Sync-Related Fields**

```sql
-- Add sync tracking fields to notes table
ALTER TABLE notes ADD COLUMN sync_version INTEGER DEFAULT 1;
ALTER TABLE notes ADD COLUMN last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE notes ADD COLUMN client_updated_at TIMESTAMP;

-- Index for sync queries
CREATE INDEX idx_notes_sync_version ON notes(sync_version);
CREATE INDEX idx_notes_last_synced ON notes(last_synced_at);
```

#### **B. Sync Conflict Resolution Table**

```sql
CREATE TABLE sync_conflicts (
  id SERIAL PRIMARY KEY,
  note_id INTEGER REFERENCES notes(id),
  user_id INTEGER REFERENCES users(id),
  conflict_type VARCHAR(50) NOT NULL, -- 'timestamp', 'content', 'concurrent'
  local_version TEXT NOT NULL, -- JSON of local note data
  server_version TEXT NOT NULL, -- JSON of server note data
  resolution_strategy VARCHAR(50), -- 'server_wins', 'client_wins', 'manual'
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **C. Sync Audit Log**

```sql
CREATE TABLE sync_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  operation_type VARCHAR(50) NOT NULL, -- 'batch_create', 'batch_update', 'batch_delete'
  notes_count INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  processing_time_ms INTEGER,
  client_info JSONB, -- Client version, device info, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **3. Server-Side Implementation Steps**

#### **Step 1: Enhance Existing Note Model**

```typescript
// models/Note.ts
interface Note {
  id: number;
  uuid: string;
  title: string;
  content: string;
  date: Date;
  color: string;
  position: { x: number; y: number };
  isDisplayed: boolean;
  isPinned: boolean;
  isTaskMode: boolean;
  userId: number;
  syncVersion: number;
  lastSyncedAt: Date;
  clientUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tasks: NoteTask[];
  tags: Tag[];
}
```

#### **Step 2: Create Batch Operation Service**

```typescript
// services/BatchSyncService.ts
export class BatchSyncService {
  /**
   * Process batch create operations
   */
  async batchCreateNotes(userId: number, notes: CreateNoteRequest[]): Promise<BatchResult> {
    const results: BatchResult = {
      successful: [],
      failed: [],
      errors: []
    };

    const transaction = await db.beginTransaction();
    
    try {
      for (const noteData of notes) {
        try {
          // Validate note data
          await this.validateNoteData(noteData);
          
          // Create note with sync metadata
          const note = await this.createNoteWithSync(userId, noteData, transaction);
          results.successful.push(note);
          
        } catch (error) {
          results.failed.push({
            noteData,
            error: error.message
          });
          results.errors.push(error.message);
        }
      }
      
      await transaction.commit();
      
      // Log batch operation
      await this.logBatchOperation(userId, 'batch_create', notes.length, results);
      
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Batch create failed: ${error.message}`);
    }
    
    return results;
  }

  /**
   * Process batch update operations with conflict detection
   */
  async batchUpdateNotes(userId: number, notes: UpdateNoteRequest[]): Promise<BatchResult> {
    const results: BatchResult = {
      successful: [],
      failed: [],
      errors: []
    };

    for (const noteData of notes) {
      try {
        // Check for conflicts
        const conflict = await this.detectConflict(noteData);
        
        if (conflict) {
          // Handle conflict based on strategy
          const resolved = await this.resolveConflict(conflict, noteData);
          results.successful.push(resolved);
        } else {
          // No conflict, update normally
          const updated = await this.updateNoteWithSync(userId, noteData);
          results.successful.push(updated);
        }
        
      } catch (error) {
        results.failed.push({
          noteData,
          error: error.message
        });
        results.errors.push(error.message);
      }
    }
    
    return results;
  }

  /**
   * Process batch delete operations
   */
  async batchDeleteNotes(userId: number, noteIds: number[]): Promise<BatchResult> {
    const results: BatchResult = {
      successful: [],
      failed: [],
      errors: []
    };

    const transaction = await db.beginTransaction();
    
    try {
      for (const noteId of noteIds) {
        try {
          // Verify ownership
          const note = await this.verifyNoteOwnership(userId, noteId);
          
          if (!note) {
            throw new Error(`Note ${noteId} not found or access denied`);
          }
          
          // Soft delete with sync metadata
          await this.softDeleteNoteWithSync(noteId, transaction);
          results.successful.push({ id: noteId, deleted: true });
          
        } catch (error) {
          results.failed.push({
            noteId,
            error: error.message
          });
          results.errors.push(error.message);
        }
      }
      
      await transaction.commit();
      
      // Log batch operation
      await this.logBatchOperation(userId, 'batch_delete', noteIds.length, results);
      
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Batch delete failed: ${error.message}`);
    }
    
    return results;
  }

  /**
   * Detect sync conflicts
   */
  private async detectConflict(noteData: UpdateNoteRequest): Promise<SyncConflict | null> {
    const serverNote = await db.notes.findById(noteData.id);
    
    if (!serverNote) {
      return null;
    }
    
    // Check if server version is newer than client version
    if (serverNote.updatedAt > noteData.clientUpdatedAt) {
      return {
        type: 'timestamp',
        serverNote,
        clientNote: noteData,
        conflictFields: this.identifyConflictFields(serverNote, noteData)
      };
    }
    
    return null;
  }

  /**
   * Resolve sync conflicts
   */
  private async resolveConflict(conflict: SyncConflict, clientData: UpdateNoteRequest): Promise<Note> {
    // Log conflict for audit
    await this.logSyncConflict(conflict);
    
    // Default strategy: server wins (can be made configurable)
    switch (conflict.resolutionStrategy || 'server_wins') {
      case 'server_wins':
        return conflict.serverNote;
        
      case 'client_wins':
        return await this.updateNoteWithSync(conflict.serverNote.userId, clientData);
        
      case 'manual':
        // Store conflict for manual resolution
        await this.storeConflictForManualResolution(conflict);
        return conflict.serverNote; // Return server version temporarily
        
      default:
        return conflict.serverNote;
    }
  }
}
```

#### **Step 3: Create API Controllers**

```typescript
// controllers/BatchSyncController.ts
export class BatchSyncController {
  private batchSyncService = new BatchSyncService();

  /**
   * POST /api/notes/batch - Batch create notes
   */
  async batchCreate(req: Request, res: Response) {
    try {
      const { notes } = req.body;
      const userId = req.user.id;
      
      // Validate request
      if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Notes array is required and cannot be empty'
        });
      }
      
      // Limit batch size
      if (notes.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Batch size cannot exceed 100 notes'
        });
      }
      
      const result = await this.batchSyncService.batchCreateNotes(userId, notes);
      
      res.status(201).json({
        success: true,
        data: result.successful,
        errors: result.errors,
        summary: {
          total: notes.length,
          successful: result.successful.length,
          failed: result.failed.length
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Batch create operation failed',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/notes/batch - Batch update notes
   */
  async batchUpdate(req: Request, res: Response) {
    try {
      const { notes } = req.body;
      const userId = req.user.id;
      
      const result = await this.batchSyncService.batchUpdateNotes(userId, notes);
      
      res.json({
        success: true,
        data: result.successful,
        errors: result.errors,
        conflicts: result.conflicts || [],
        summary: {
          total: notes.length,
          successful: result.successful.length,
          failed: result.failed.length,
          conflicts: result.conflicts?.length || 0
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Batch update operation failed',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/notes/batch - Batch delete notes
   */
  async batchDelete(req: Request, res: Response) {
    try {
      const { noteIds } = req.body;
      const userId = req.user.id;
      
      const result = await this.batchSyncService.batchDeleteNotes(userId, noteIds);
      
      res.json({
        success: true,
        data: result.successful,
        errors: result.errors,
        summary: {
          total: noteIds.length,
          successful: result.successful.length,
          failed: result.failed.length
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Batch delete operation failed',
        error: error.message
      });
    }
  }
}
```

#### **Step 4: Add Rate Limiting and Security**

```typescript
// middleware/rateLimiting.ts
import rateLimit from 'express-rate-limit';

export const syncRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each user to 10 sync requests per windowMs
  message: {
    success: false,
    message: 'Too many sync requests, please try again later'
  },
  keyGenerator: (req) => req.user.id, // Rate limit per user
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// middleware/validation.ts
export const validateBatchRequest = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  
  // Validate batch size
  if (body.notes && body.notes.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Batch size cannot exceed 100 items'
    });
  }
  
  // Validate each note in batch
  if (body.notes) {
    for (const note of body.notes) {
      if (!note.title || !note.content) {
        return res.status(400).json({
          success: false,
          message: 'Each note must have title and content'
        });
      }
    }
  }
  
  next();
};
```

#### **Step 5: Enhanced Error Handling**

```typescript
// middleware/errorHandler.ts
export const syncErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Sync Error:', error);
  
  // Log error details for debugging
  const errorLog = {
    timestamp: new Date(),
    userId: req.user?.id,
    endpoint: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
    requestBody: req.body
  };
  
  // Send to logging service
  logger.error('Sync operation failed', errorLog);
  
  // Return appropriate error response
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: error.message
    });
  }
  
  if (error.name === 'ConflictError') {
    return res.status(409).json({
      success: false,
      message: 'Sync conflict detected',
      conflict: error.conflictData
    });
  }
  
  // Generic server error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    requestId: req.requestId
  });
};
```

### **4. API Routes Setup**

```typescript
// routes/sync.ts
import express from 'express';
import { BatchSyncController } from '../controllers/BatchSyncController';
import { syncRateLimiter, validateBatchRequest } from '../middleware';

const router = express.Router();
const batchController = new BatchSyncController();

// Apply middleware
router.use(syncRateLimiter);
router.use(validateBatchRequest);

// Batch operations
router.post('/api/notes/batch', batchController.batchCreate);
router.put('/api/notes/batch', batchController.batchUpdate);
router.delete('/api/notes/batch', batchController.batchDelete);

// Health check (no rate limiting)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

export default router;
```

### **5. Database Optimizations**

#### **A. Indexing Strategy**

```sql
-- Optimize queries for sync operations
CREATE INDEX idx_notes_user_updated ON notes(user_id, updated_at DESC);
CREATE INDEX idx_notes_user_sync_version ON notes(user_id, sync_version);
CREATE INDEX idx_notes_uuid ON notes(uuid);

-- Optimize tag queries
CREATE INDEX idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX idx_tags_name ON tags(name);
```

#### **B. Connection Pooling**

```typescript
// config/database.ts
export const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    min: 5,
    max: 20,
    idle: 30000,
    acquire: 60000,
  },
  logging: process.env.NODE_ENV === 'development'
};
```

### **6. Monitoring and Logging**

#### **A. Sync Metrics**

```typescript
// services/MetricsService.ts
export class MetricsService {
  static trackSyncOperation(operation: string, duration: number, success: boolean) {
    // Send to monitoring service (e.g., Prometheus, DataDog)
    metrics.increment('sync_operations_total', {
      operation,
      success: success.toString()
    });
    
    metrics.histogram('sync_operation_duration', duration, {
      operation
    });
  }
  
  static trackBatchSize(operation: string, batchSize: number) {
    metrics.histogram('sync_batch_size', batchSize, {
      operation
    });
  }
}
```

#### **B. Audit Logging**

```typescript
// services/AuditService.ts
export class AuditService {
  static async logSyncOperation(userId: number, operation: string, details: any) {
    await db.syncAuditLog.create({
      userId,
      operationType: operation,
      notesCount: details.notesCount,
      successCount: details.successCount,
      errorCount: details.errorCount,
      processingTimeMs: details.processingTime,
      clientInfo: details.clientInfo
    });
  }
}
```

### **7. Testing Strategy**

#### **A. Unit Tests**

```typescript
// tests/batchSync.test.ts
describe('BatchSyncService', () => {
  it('should handle batch create operations', async () => {
    const notes = [createMockNote(), createMockNote()];
    const result = await batchSyncService.batchCreateNotes(userId, notes);
    
    expect(result.successful).toHaveLength(2);
    expect(result.failed).toHaveLength(0);
  });
  
  it('should handle conflicts in batch updates', async () => {
    // Setup conflict scenario
    const conflictNote = await createNoteWithConflict();
    const result = await batchSyncService.batchUpdateNotes(userId, [conflictNote]);
    
    expect(result.conflicts).toHaveLength(1);
  });
});
```

#### **B. Integration Tests**

```typescript
// tests/integration/syncAPI.test.ts
describe('Sync API Integration', () => {
  it('should handle concurrent batch operations', async () => {
    const promises = [];
    
    // Simulate multiple clients syncing simultaneously
    for (let i = 0; i < 5; i++) {
      promises.push(
        request(app)
          .post('/api/notes/batch')
          .set('Authorization', `Bearer ${token}`)
          .send({ notes: createMockNotes(10) })
      );
    }
    
    const results = await Promise.all(promises);
    results.forEach(result => {
      expect(result.status).toBe(201);
    });
  });
});
```

### **8. Performance Considerations**

#### **A. Caching Strategy**

```typescript
// services/CacheService.ts
export class CacheService {
  private redis = new Redis(process.env.REDIS_URL);
  
  async cacheUserNotes(userId: number, notes: Note[]) {
    const key = `user:${userId}:notes`;
    await this.redis.setex(key, 300, JSON.stringify(notes)); // 5 minute cache
  }
  
  async getCachedUserNotes(userId: number): Promise<Note[] | null> {
    const key = `user:${userId}:notes`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
}
```

#### **B. Background Processing**

```typescript
// services/BackgroundSyncService.ts
import Bull from 'bull';

export class BackgroundSyncService {
  private syncQueue = new Bull('sync processing', process.env.REDIS_URL);
  
  constructor() {
    this.syncQueue.process('batch-operation', this.processBatchOperation);
  }
  
  async queueBatchOperation(userId: number, operation: string, data: any) {
    await this.syncQueue.add('batch-operation', {
      userId,
      operation,
      data,
      timestamp: Date.now()
    }, {
      attempts: 3,
      backoff: 'exponential',
      delay: 1000
    });
  }
  
  private async processBatchOperation(job: Bull.Job) {
    const { userId, operation, data } = job.data;
    
    // Process the batch operation
    switch (operation) {
      case 'batch_create':
        return await this.batchSyncService.batchCreateNotes(userId, data.notes);
      case 'batch_update':
        return await this.batchSyncService.batchUpdateNotes(userId, data.notes);
      case 'batch_delete':
        return await this.batchSyncService.batchDeleteNotes(userId, data.noteIds);
    }
  }
}
```

### **9. Deployment Checklist**

#### **Environment Variables**
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=draggy_notes
DB_USER=postgres
DB_PASSWORD=password

# Redis (for caching and queues)
REDIS_URL=redis://localhost:6379

# API Configuration
API_VERSION=1.0.0
MAX_BATCH_SIZE=100
SYNC_RATE_LIMIT=10

# Monitoring
METRICS_ENABLED=true
LOG_LEVEL=info
```

#### **Database Migrations**
```bash
# Run migrations to add sync-related fields
npm run migrate:sync-fields
npm run migrate:sync-tables
npm run migrate:indexes
```

#### **Health Checks**
```bash
# Verify all endpoints are working
curl -X GET http://localhost:3000/health
curl -X POST http://localhost:3000/api/notes/batch -H "Authorization: Bearer $TOKEN" -d '{"notes":[]}'
```

## 🚀 **Deployment Steps**

1. **Database Setup**
   - Run migration scripts to add sync-related fields
   - Create indexes for optimal query performance
   - Set up audit and conflict resolution tables

2. **API Enhancements**
   - Implement batch operation endpoints
   - Add rate limiting and validation middleware
   - Set up error handling and logging

3. **Monitoring Setup**
   - Configure metrics collection
   - Set up audit logging
   - Implement health checks

4. **Testing**
   - Run unit and integration tests
   - Perform load testing with batch operations
   - Test conflict resolution scenarios

5. **Production Deployment**
   - Deploy with proper environment variables
   - Monitor sync operation metrics
   - Set up alerts for errors and performance issues

This implementation provides a robust server-side foundation for the enhanced client-side sync system, ensuring data consistency, performance, and reliability.
