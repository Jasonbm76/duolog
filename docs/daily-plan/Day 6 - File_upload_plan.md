# TC Prompt: Add File Upload to DuoLog Chat Interface

## Context
Add file upload functionality to the existing chat page in DuoLog.ai. Users should be able to upload documents (especially PDFs) that Claude can analyze when ChatGPT fails. The file button should be positioned next to the microphone and send button in the chat input area.

## Technical Requirements

### File Upload Component
Create a new component `FileUpload.tsx` that handles:
- File selection with drag & drop support
- File validation (PDFs, images, text files)
- File size limits (10MB max)
- Upload progress indicator
- Error handling for unsupported files

### UI Integration
Modify the existing chat input component to include:
- File upload button (use `Paperclip` icon from lucide-react)
- Position between microphone and send button
- Show selected file name/preview when file is chosen
- Remove file option before sending

### File Storage & Processing
- Use Supabase Storage for file uploads
- Generate unique file names to prevent conflicts
- Store file metadata in database
- Return file URL for AI processing

### Design Requirements
- Match existing glassmorphism design system
- Use semantic colors (primary: blue-600, accent: violet-500)
- Smooth animations with Framer Motion
- Mobile-responsive design
- Proper loading states and error feedback

## Implementation Details

### Component Structure
```typescript
// New component: components/FileUpload.tsx
interface FileUploadProps {
  onFileSelect: (file: File, fileUrl: string) => void;
  onFileRemove: () => void;
  selectedFile?: File;
  isUploading?: boolean;
}
```

### Chat Input Integration
Update the existing chat input to include:
- File upload button with tooltip "Attach document"
- Selected file display with remove option
- Modify submit handler to include file data
- Update conversation flow to handle files

### Database Schema
Add to existing Supabase schema:
```sql
-- Add to conversations table
ALTER TABLE conversations ADD COLUMN file_url TEXT;
ALTER TABLE conversations ADD COLUMN file_name TEXT;
ALTER TABLE conversations ADD COLUMN file_type TEXT;
```

### API Route Enhancement
Modify `/api/chat` or create `/api/upload` to:
- Handle file uploads to Supabase Storage
- Pass file content to Claude/ChatGPT APIs
- Include file context in AI prompts

## File Types Support
Priority order:
1. PDFs (.pdf) - Primary use case
2. Images (.jpg, .png, .gif) - Screenshots, diagrams
3. Text files (.txt, .md) - Documentation
4. Code files (.js, .ts, .py, etc.) - Code review

## Error Handling
- File too large (>10MB)
- Unsupported file types
- Upload failures
- AI processing errors
- Network timeouts

## Security Considerations
- File type validation on both client and server
- Scan for malicious content
- User-specific file access (RLS in Supabase)
- Automatic file cleanup after processing

## UX Enhancements
- Drag & drop anywhere in chat area
- File preview thumbnails
- Upload progress with cancel option
- Clear success/error states
- Keyboard accessibility

## Integration with AI Collaboration
When file is present:
1. Claude analyzes the document first (better document handling)
2. ChatGPT refines Claude's analysis
3. Final collaborative response includes file insights
4. Show file reference in conversation history

## Testing Requirements
- Upload different file types and sizes
- Test drag & drop functionality
- Verify mobile responsiveness
- Test error scenarios
- Validate AI processing with files

## Deployment Notes
- Update environment variables for Supabase Storage
- Configure CORS settings for file uploads
- Test file upload limits in production
- Monitor storage costs and usage

## Output Structure
Please create/modify these files:
1. `components/FileUpload.tsx` - Main file upload component
2. `components/ChatInput.tsx` - Update existing chat input
3. `app/api/upload/route.ts` - File upload API endpoint
4. `lib/supabase-storage.ts` - Storage utility functions
5. Update chat page to integrate file upload
6. Add necessary database migrations

Maintain the existing design system with glassmorphism effects and ensure TypeScript strict mode compliance throughout.