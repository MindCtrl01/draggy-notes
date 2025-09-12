# API Integration Guide

This document explains how the notes API integration works and how to set up your backend.

## 🔗 API Endpoints

The application expects these endpoints from your backend:

### 1. **GET /notes**
Fetch all notes for the user.

**Response:**
```json
[
  {
    "id": "note-123",
    "content": "My first note",
    "color": "yellow",
    "position": { "x": 100, "y": 150 },
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:30:00Z"
  }
]
```

### 2. **POST /note**
Create a new note.

**Request Body:**
```json
{
  "content": "New note content",
  "color": "blue",
  "position": { "x": 200, "y": 300 }
}
```

**Response:**
```json
{
  "id": "note-456",
  "content": "New note content",
  "color": "blue",
  "position": { "x": 200, "y": 300 },
  "createdAt": "2024-01-01T13:00:00Z",
  "updatedAt": "2024-01-01T13:00:00Z"
}
```

### 3. **PUT /note/{id}**
Update an existing note.

**Request Body (all fields optional):**
```json
{
  "content": "Updated content",
  "color": "green",
  "position": { "x": 250, "y": 350 }
}
```

**Response:**
```json
{
  "id": "note-456",
  "content": "Updated content",
  "color": "green",
  "position": { "x": 250, "y": 350 },
  "createdAt": "2024-01-01T13:00:00Z",
  "updatedAt": "2024-01-01T13:15:00Z"
}
```

### 4. **DELETE /note/{id}**
Delete a note.

**Response:** `204 No Content`

## 🔧 Configuration

### Vercel Environment Variables

For Vercel deployment, set these environment variables in your Vercel Dashboard:

#### **Production Environment:**
```bash
VITE_API_BASE_URL=https://your-api-domain.vercel.app/api
VITE_API_TIMEOUT=10000
```

#### **Local Development (.env.local):**
```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TIMEOUT=5000
```

### API Configuration

The API configuration automatically adapts to your environment:

```typescript
// src/lib/config/api.ts
const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    // Production: Use Vercel environment variable
    return import.meta.env.VITE_API_BASE_URL || 'https://your-api-domain.vercel.app/api';
  }
  
  // Development: Use local development server
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
} as const;
```

### Vercel Deployment Setup

1. **Add Environment Variables in Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add `VITE_API_BASE_URL` with your API endpoint
   - Set environment (Production, Preview, Development)

2. **Automatic Configuration:**
   - The app automatically detects Vercel deployment
   - Uses production API in production environment
   - Falls back to local API in development

## 🎯 Usage Examples

### Creating a Note
When a user creates a note (double-click or + button):

```typescript
// Automatically called by useNotes hook
const newNote = await notesApi.createNote({
  content: '',
  color: 'yellow',
  position: { x: 100, y: 150 }
});
```

### Updating Note Content
When a user finishes editing:

```typescript
// Automatically called when user presses Enter or clicks away
const updatedNote = await notesApi.updateNote(noteId, {
  content: 'Updated text content'
});
```

### Updating Note Position
When a user finishes dragging:

```typescript
// Automatically called when user releases the mouse
const updatedNote = await notesApi.updateNote(noteId, {
  position: { x: 250, y: 350 }
});
```

## 🔄 State Management

The application uses React Query for:

- **Caching**: API responses are cached for 5 minutes
- **Optimistic Updates**: UI updates immediately, syncs with server
- **Error Handling**: Automatic retry and error notifications
- **Loading States**: Loading indicators during API calls

### Key Features:

1. **Optimistic Dragging**: Notes move smoothly during drag, API call happens on release
2. **Auto-save**: Content changes trigger API calls automatically
3. **Error Recovery**: Failed requests show error messages and retry options
4. **Loading Indicators**: Visual feedback during API operations

## 🚨 Error Handling

The API integration includes comprehensive error handling:

```typescript
// Automatic error notifications
toast.error('Failed to save note. Please try again.');

// Console logging for debugging
console.error('API Request failed:', error);

// Retry logic built-in with React Query
retry: 2, // Automatically retry failed requests
```

## 📱 Offline Behavior

Currently, the app requires an internet connection. For offline support, you could:

1. Add service worker for caching
2. Store changes locally and sync when online
3. Show offline indicators

## 🔧 Backend Implementation Example

Here's a basic Node.js/Express example:

```javascript
// Basic Express.js backend example
app.get('/api/notes', async (req, res) => {
  const notes = await Note.findAll();
  res.json(notes);
});

app.post('/api/note', async (req, res) => {
  const { content, color, position } = req.body;
  const note = await Note.create({
    content,
    color,
    position,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  res.json(note);
});

app.put('/api/note/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const note = await Note.findByIdAndUpdate(id, {
    ...updates,
    updatedAt: new Date()
  }, { new: true });
  res.json(note);
});

app.delete('/api/note/:id', async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
```

This API integration provides a robust foundation for a real-time note-taking application with proper error handling, loading states, and optimistic updates!
