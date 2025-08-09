# CRUD Operations Guide for Finance Tracker

This guide explains how to add new entities and CRUD operations to the Finance Tracker application without assistance.

## Overview

The application follows a standard full-stack architecture:
- **Backend**: Express.js + TypeScript + SQLite
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: SQLite with manual query handling

## Adding New CRUD Entity - Step by Step

### 1. Define Database Schema

**File**: `backend/src/utils/initDb.ts`

Add your table creation in the `initializeDatabase` function:

```typescript
// Create your_entity table
await query(`
  CREATE TABLE IF NOT EXISTS your_entities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    your_field VARCHAR(100),
    another_field DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
```

**Key Points**:
- Always include `user_id` for user-scoped entities
- Use `CHECK` constraints for enums
- Follow naming conventions: `your_entities` (plural, snake_case)

### 2. Define TypeScript Types

**File**: `backend/src/models/types.ts`

Add interfaces for your entity:

```typescript
export interface YourEntity {
  id: number;
  user_id: number;
  name: string;
  your_field: string;
  another_field: number;
  status: 'active' | 'inactive';
  created_at: Date;
}

export interface CreateYourEntityRequest {
  name: string;
  your_field: string;
  another_field?: number;
  status: 'active' | 'inactive';
}

export interface UpdateYourEntityRequest {
  name?: string;
  your_field?: string;
  another_field?: number;
  status?: 'active' | 'inactive';
}
```

### 3. Create API Routes

**File**: `backend/src/routes/yourEntities.ts`

```typescript
import { Router, Request, Response } from 'express';
import { query } from '../utils/database';
import { authenticateToken } from '../middleware/auth';
import { YourEntity, CreateYourEntityRequest, UpdateYourEntityRequest } from '../models/types';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/your-entities - Get all entities for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await query(
      'SELECT id, user_id, name, your_field, another_field, status, created_at FROM your_entities WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const entities: YourEntity[] = result.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      your_field: row.your_field,
      another_field: parseFloat(row.another_field) || 0,
      status: row.status,
      created_at: new Date(row.created_at)
    }));

    res.json(entities);
  } catch (error) {
    console.error('Error fetching entities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/your-entities - Create a new entity
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, your_field, another_field = 0, status }: CreateYourEntityRequest = req.body;

    // Validate required fields
    if (!name || !your_field || !status) {
      return res.status(400).json({
        error: 'Name, your_field, and status are required'
      });
    }

    // Validate enums
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        error: 'Status must be either "active" or "inactive"'
      });
    }

    const insertResult = await query(
      'INSERT INTO your_entities (user_id, name, your_field, another_field, status) VALUES (?, ?, ?, ?, ?)',
      [userId, name, your_field, another_field, status]
    );

    if (insertResult.rowCount === 0) {
      return res.status(500).json({ error: 'Failed to create entity' });
    }

    // Get the created entity
    const result = await query(
      'SELECT id, user_id, name, your_field, another_field, status, created_at FROM your_entities WHERE rowid = last_insert_rowid()'
    );

    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to retrieve created entity' });
    }

    const newEntity: YourEntity = {
      id: result.rows[0].id,
      user_id: result.rows[0].user_id,
      name: result.rows[0].name,
      your_field: result.rows[0].your_field,
      another_field: parseFloat(result.rows[0].another_field) || 0,
      status: result.rows[0].status,
      created_at: new Date(result.rows[0].created_at)
    };

    res.status(201).json(newEntity);
  } catch (error) {
    console.error('Error creating entity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/your-entities/:id - Update an existing entity
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const entityId = parseInt(req.params.id);
    const updateData: UpdateYourEntityRequest = req.body;

    if (isNaN(entityId)) {
      return res.status(400).json({ error: 'Invalid entity ID' });
    }

    // Check if entity exists and belongs to user
    const existingEntity = await query(
      'SELECT id FROM your_entities WHERE id = ? AND user_id = ?',
      [entityId, userId]
    );

    if (existingEntity.rows.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Validate enums if provided
    if (updateData.status && !['active', 'inactive'].includes(updateData.status)) {
      return res.status(400).json({
        error: 'Status must be either "active" or "inactive"'
      });
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updateData.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updateData.name);
    }
    if (updateData.your_field !== undefined) {
      updateFields.push('your_field = ?');
      updateValues.push(updateData.your_field);
    }
    if (updateData.another_field !== undefined) {
      updateFields.push('another_field = ?');
      updateValues.push(updateData.another_field);
    }
    if (updateData.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(updateData.status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(entityId);

    const updateQuery = `UPDATE your_entities SET ${updateFields.join(', ')} WHERE id = ?`;
    const updateResult = await query(updateQuery, updateValues);

    if (updateResult.rowCount === 0) {
      return res.status(500).json({ error: 'Failed to update entity' });
    }

    // Get the updated entity
    const result = await query(
      'SELECT id, user_id, name, your_field, another_field, status, created_at FROM your_entities WHERE id = ?',
      [entityId]
    );

    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to retrieve updated entity' });
    }

    const updatedEntity: YourEntity = {
      id: result.rows[0].id,
      user_id: result.rows[0].user_id,
      name: result.rows[0].name,
      your_field: result.rows[0].your_field,
      another_field: parseFloat(result.rows[0].another_field) || 0,
      status: result.rows[0].status,
      created_at: new Date(result.rows[0].created_at)
    };

    res.json(updatedEntity);
  } catch (error) {
    console.error('Error updating entity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/your-entities/:id - Delete an entity
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const entityId = parseInt(req.params.id);

    if (isNaN(entityId)) {
      return res.status(400).json({ error: 'Invalid entity ID' });
    }

    // Check if entity exists and belongs to user
    const existingEntity = await query(
      'SELECT id FROM your_entities WHERE id = ? AND user_id = ?',
      [entityId, userId]
    );

    if (existingEntity.rows.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Add any cascade delete logic here if needed
    // For example, check for related records:
    // const relatedCount = await query(
    //   'SELECT COUNT(*) as count FROM related_table WHERE your_entity_id = ?',
    //   [entityId]
    // );
    //
    // if (relatedCount.rows[0].count > 0) {
    //   return res.status(409).json({
    //     error: 'Cannot delete entity with related records'
    //   });
    // }

    // Delete the entity
    const result = await query(
      'DELETE FROM your_entities WHERE id = ? AND user_id = ?',
      [entityId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(500).json({ error: 'Failed to delete entity' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting entity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### 4. Register Routes in Server

**File**: `backend/src/server.ts`

```typescript
// Add import
import yourEntitiesRoutes from './routes/yourEntities';

// Add route registration
app.use('/api/your-entities', yourEntitiesRoutes);
```

### 5. Frontend Implementation

#### 5.1 Create React Component/Page

**File**: `frontend/src/pages/YourEntities.tsx`

```typescript
import { useState, useEffect } from 'react';

interface YourEntity {
  id: number;
  user_id: number;
  name: string;
  your_field: string;
  another_field: number;
  status: 'active' | 'inactive';
  created_at: string;
}

const YourEntities = () => {
  const [entities, setEntities] = useState<YourEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<YourEntity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    your_field: '',
    another_field: 0,
    status: 'active' as 'active' | 'inactive'
  });

  const fetchEntities = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('http://localhost:3001/api/your-entities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }

      const entitiesData = await response.json();
      setEntities(entitiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entities');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = editingEntity 
        ? `http://localhost:3001/api/your-entities/${editingEntity.id}`
        : 'http://localhost:3001/api/your-entities';
      
      const method = editingEntity ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save entity');
      }

      await fetchEntities();
      setShowForm(false);
      setEditingEntity(null);
      setFormData({
        name: '',
        your_field: '',
        another_field: 0,
        status: 'active'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entity');
    }
  };

  const handleEdit = (entity: YourEntity) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      your_field: entity.your_field,
      another_field: entity.another_field,
      status: entity.status
    });
    setShowForm(true);
  };

  const handleDelete = async (entityId: number) => {
    if (!confirm('Are you sure you want to delete this entity?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/api/your-entities/${entityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete entity');
      }

      await fetchEntities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entity');
    }
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Your UI implementation here */}
    </div>
  );
};

export default YourEntities;
```

### 6. Add Route to App

**File**: `frontend/src/App.tsx`

```typescript
// Add import
import YourEntities from './pages/YourEntities';

// Add route in the authenticated routes section
<Route path="/your-entities" element={<YourEntities />} />
```

## Key Patterns and Best Practices

### Backend Patterns

1. **Always use authentication middleware** for protected routes
2. **Validate input data** before database operations
3. **Handle SQLite quirks** - no RETURNING clause, use separate SELECT
4. **Use consistent error handling** - try/catch with descriptive messages
5. **Check user ownership** - verify entity belongs to authenticated user
6. **Use TypeScript interfaces** for type safety

### Frontend Patterns

1. **useState for state management** - entities list, loading, error, form data
2. **useEffect for data fetching** on component mount
3. **Consistent error handling** - show user-friendly error messages
4. **Form state management** - separate form data from entity list
5. **Loading states** - show spinners during async operations
6. **Confirmation dialogs** for destructive operations

### Database Patterns

1. **Always include user_id** for multi-tenant data
2. **Use CHECK constraints** for enums
3. **Follow naming conventions** - snake_case tables, camelCase frontend
4. **Include created_at** timestamps
5. **Use foreign keys** with CASCADE for cleanup

### Common Issues and Solutions

1. **SQLite RETURNING not working**: Use separate INSERT + SELECT
2. **Type mismatches**: Always parse numbers from database results
3. **CORS issues**: Ensure backend allows frontend origin
4. **Token expiration**: Handle 401 responses by redirecting to login
5. **Form validation**: Validate on both frontend and backend

## File Checklist for New Entity

- [ ] `backend/src/utils/initDb.ts` - Database table creation
- [ ] `backend/src/models/types.ts` - TypeScript interfaces  
- [ ] `backend/src/routes/yourEntity.ts` - API routes
- [ ] `backend/src/server.ts` - Route registration
- [ ] `frontend/src/pages/YourEntity.tsx` - React component
- [ ] `frontend/src/App.tsx` - Route configuration

## Testing Your Implementation

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Test in browser: Create, read, update, delete operations
4. Check browser network tab for API calls
5. Check backend console for database logs

This guide should enable you to add new CRUD entities independently. Follow the patterns established in the existing accounts implementation for consistency.