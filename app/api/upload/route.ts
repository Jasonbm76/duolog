import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, deleteFile } from '@/lib/supabase-storage';
import { validateEmail } from '@/lib/utils/input-validation';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const email = formData.get('email') as string;
    const sessionId = formData.get('sessionId') as string;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create a user identifier for storage (using email hash for folder structure)
    const userIdentifier = Buffer.from(emailValidation.sanitized).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);

    // Upload file to Supabase Storage using user identifier
    const uploadResult = await uploadFile(file, userIdentifier);

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Upload failed' },
        { status: 500 }
      );
    }

    // Return upload result
    return NextResponse.json({
      success: true,
      fileUrl: uploadResult.fileUrl,
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      fileType: uploadResult.fileType,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Parse request body
    const { fileUrl, email, sessionId } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const userIdentifier = Buffer.from(emailValidation.sanitized).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL required' },
        { status: 400 }
      );
    }

    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'duolog-files');
    
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400 }
      );
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    // Verify user owns the file (path should start with user identifier)
    if (!filePath.startsWith(userIdentifier)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete file from storage
    const deleteResult = await deleteFile(filePath);

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error || 'Delete failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}