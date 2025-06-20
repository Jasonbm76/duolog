import { createClient } from '@/utils/supabase/client';

const BUCKET_NAME = 'duolog-files';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  // Documents
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  
  // Code files
  'text/javascript': ['.js'],
  'text/typescript': ['.ts'],
  'application/json': ['.json'],
  'text/html': ['.html'],
  'text/css': ['.css'],
  'text/x-python': ['.py'],
} as const;

export interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Validate file before upload
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds 10MB limit`
    };
  }

  // Check file type
  const supportedTypes = Object.keys(SUPPORTED_FILE_TYPES);
  const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES).flat();
  
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isTypeSupported = supportedTypes.includes(file.type) || 
                         supportedExtensions.includes(fileExtension);

  if (!isTypeSupported) {
    return {
      isValid: false,
      error: `File type not supported. Supported types: PDF, images, text files, and code files`
    };
  }

  return { isValid: true };
}

// Generate unique file path for user
function generateFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2);
  const fileExtension = fileName.split('.').pop();
  const sanitizedName = fileName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars
    .substring(0, 50); // Limit length

  return `${userId}/${timestamp}_${randomId}_${sanitizedName}.${fileExtension}`;
}

// Upload file to Supabase Storage
export async function uploadFile(file: File, userId: string): Promise<FileUploadResult> {
  const supabase = createClient();
  
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Generate unique file path
    const filePath = generateFilePath(userId, file.name);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: 'Failed to upload file to storage'
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: 'Unexpected error during file upload'
    };
  }
}

// Delete file from storage
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return {
        success: false,
        error: 'Failed to delete file from storage'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: 'Unexpected error during file deletion'
    };
  }
}

// Extract file path from URL
export function getFilePathFromUrl(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === BUCKET_NAME);
    
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return null;
    }

    return pathParts.slice(bucketIndex + 1).join('/');
  } catch {
    return null;
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Get file type icon (for UI)
export function getFileTypeIcon(fileType: string, fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.startsWith('text/')) return '📝';
  if (extension === 'js' || extension === 'ts') return '⚙️';
  if (extension === 'json') return '🔧';
  if (extension === 'html') return '🌐';
  if (extension === 'css') return '🎨';
  if (extension === 'py') return '🐍';
  
  return '📎';
}