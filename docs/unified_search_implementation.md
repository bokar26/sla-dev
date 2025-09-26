# Unified Search Implementation

## Overview

This document describes the unified search implementation that provides a single search interface for both text and image-based factory searches, with robust API connectivity monitoring.

## Architecture

### Frontend Components

#### 1. Configuration (`src/config.ts`)
- Centralized configuration for API base URL and development flags
- Environment variable support for different deployment environments

#### 2. Network Utilities (`src/lib/net.ts`)
- `pingAPI()`: Health check function with timeout
- `useApiStatus()`: Global API status management to avoid duplicate banners
- Simple state management without external dependencies

#### 3. API Wrapper (`src/lib/api.js`)
- `apiFetch()`: Centralized fetch wrapper with error handling
- `unifiedSearch()`: Main search function that handles both text and image search
- Automatic online/offline status management
- Legacy endpoint support for backward compatibility

#### 4. AppShell Component (`src/components/AppShell.jsx`)
- Global API connectivity monitoring
- Single banner for API connection issues
- Automatic health checks every 15 seconds
- Wraps the entire application

#### 5. Unified Search Component (`src/components/search/UnifiedSearch.jsx`)
- Single search interface for text and images
- Optional image upload (max 5 files, 12MB each)
- Real-time search mode indication
- Error handling with fallback to mock data in development

### Backend Components

#### 1. Unified Search Endpoint (`/api/search/unified`)
- Handles both JSON (text-only) and multipart (text + images) requests
- Automatic mode detection based on request type
- Comprehensive validation and error handling
- Returns structured response with mode, results, and metadata

#### 2. Health Check Endpoint (`/healthz`)
- Simple health check for monitoring
- Returns API status and timestamp
- Used by frontend for connectivity monitoring

#### 3. Global Exception Handler
- Catches all unhandled exceptions
- Returns structured error responses
- Logs full stack traces for debugging
- Includes request context (URL, method, timestamp)

## API Endpoints

### Unified Search
```
POST /api/search/unified
```

**Text-only search (JSON):**
```json
{
  "q": "cotton hoodie factory",
  "topK": 10
}
```

**Image + text search (multipart):**
```
Content-Type: multipart/form-data
- q: "optional text query"
- topK: "10"
- files: [image files]
```

**Response:**
```json
{
  "mode": "text|image|image+text",
  "results": [...],
  "total_found": 5,
  "search_time": 1.234,
  "extracted_attributes": {...} // only for image searches
}
```

### Health Check
```
GET /healthz
```

**Response:**
```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Error Handling

### Frontend Error Handling
- **Global connectivity banner**: Single banner for API connection issues
- **Inline search errors**: Specific error messages for search failures
- **Graceful degradation**: Fallback to mock data in development
- **Input validation**: Client-side validation for file types and sizes

### Backend Error Handling
- **Structured error responses**: Consistent JSON error format
- **Comprehensive validation**: File size, type, and content validation
- **Graceful failures**: Continue processing other images if one fails
- **Detailed logging**: Full stack traces for debugging

## Development Features

### 1. Mock Data Fallback
Set `VITE_DEV_FAKE_RESULTS=1` to enable mock data when the API is unavailable:

```bash
# .env.local
VITE_DEV_FAKE_RESULTS=1
```

### 2. API Health Monitoring
- Automatic health checks every 15 seconds
- Real-time connectivity status
- Single banner for connection issues
- No duplicate error messages

### 3. Development Tools
- Comprehensive test script (`test_unified_search.py`)
- Error handling validation
- Legacy endpoint compatibility testing
- Performance monitoring

## Usage Examples

### Text-Only Search
```javascript
import { unifiedSearch } from './lib/api';

const results = await unifiedSearch('cotton hoodie factory', [], { topK: 10 });
console.log(results.mode); // "text"
console.log(results.results); // Array of factory results
```

### Image + Text Search
```javascript
import { unifiedSearch } from './lib/api';

const files = [file1, file2]; // File objects
const results = await unifiedSearch('cotton hoodie', files, { topK: 10 });
console.log(results.mode); // "image+text"
console.log(results.extracted_attributes); // AI-extracted attributes
```

### API Status Monitoring
```javascript
import { useApiStatus } from './lib/net';

function MyComponent() {
  const { online, setOnline } = useApiStatus();
  
  return (
    <div>
      {!online && <div>API is offline</div>}
      {/* Your component content */}
    </div>
  );
}
```

## Testing

### Automated Testing
Run the comprehensive test script:

```bash
python test_unified_search.py
```

### Manual Testing
1. **Start the backend**: `python api_server.py`
2. **Start the frontend**: `npm run dev`
3. **Test scenarios**:
   - Text-only search
   - Image-only search
   - Combined text + image search
   - API connectivity issues
   - File validation errors

### Test Scenarios
- ✅ Health check endpoint
- ✅ Text-only search
- ✅ Image + text search
- ✅ Input validation
- ✅ Error handling
- ✅ Legacy endpoint compatibility
- ✅ File size validation
- ✅ API connectivity monitoring

## Performance Considerations

### Frontend
- **Lazy loading**: Components are lazy-loaded to improve initial load time
- **Debounced health checks**: API health checks every 15 seconds
- **Efficient state management**: Simple state management without external dependencies
- **Error boundaries**: Component-level error handling

### Backend
- **Temporary file cleanup**: Automatic cleanup of uploaded images
- **Async processing**: Non-blocking image analysis
- **Timeout handling**: 15-second timeout for API requests
- **Resource management**: Proper cleanup of temporary resources

## Security Features

### File Upload Security
- **File type validation**: Only image files allowed
- **File size limits**: 12MB maximum per file
- **EXIF stripping**: Automatic removal of metadata
- **Temporary storage**: Files auto-delete after 24 hours

### API Security
- **CORS configuration**: Proper cross-origin resource sharing
- **Input validation**: Comprehensive validation of all inputs
- **Error sanitization**: No sensitive data in error messages
- **Rate limiting**: Built-in protection against abuse

## Deployment

### Environment Variables
```bash
# Frontend
VITE_API_BASE=http://localhost:8000
VITE_DEV_FAKE_RESULTS=1

# Backend
FRONTEND_ORIGIN=http://localhost:5173
FEATURE_REVERSE_IMAGE_SEARCH=1
MISTRAL_API_KEY=your_api_key
```

### Production Considerations
- Set `VITE_DEV_FAKE_RESULTS=0` in production
- Configure proper CORS origins
- Set up Mistral API key for image analysis
- Monitor API health and performance
- Set up proper logging and monitoring

## Future Enhancements

1. **Real-time search**: WebSocket-based real-time search updates
2. **Search history**: Save and reuse previous searches
3. **Advanced filtering**: More sophisticated search filters
4. **Search analytics**: Track search patterns and performance
5. **Offline support**: Cache results for offline use
6. **Search suggestions**: Auto-complete and search suggestions
7. **Multi-language support**: Support for multiple languages
8. **Advanced image analysis**: More sophisticated image processing

## Troubleshooting

### Common Issues

1. **API not responding**: Check if backend is running on correct port
2. **CORS errors**: Verify CORS configuration in backend
3. **File upload failures**: Check file size and type limits
4. **Search timeouts**: Verify network connectivity and API health
5. **Build failures**: Check for missing dependencies

### Debug Tools
- Browser Network tab for API requests
- Backend logs for server-side errors
- Health check endpoint for API status
- Test script for comprehensive validation

## Conclusion

The unified search implementation provides a robust, user-friendly interface for both text and image-based factory searches. With comprehensive error handling, API connectivity monitoring, and development-friendly features, it offers a solid foundation for production use while maintaining excellent developer experience.
