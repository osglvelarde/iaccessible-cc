import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const EVIDENCE_DIR = path.join(process.cwd(), 'manual-testing-results', 'evidence');

// Ensure evidence directory exists
async function ensureEvidenceDirectory(testId: string) {
  const testEvidenceDir = path.join(EVIDENCE_DIR, testId);
  try {
    await fs.mkdir(testEvidenceDir, { recursive: true });
  } catch (error) {
    console.error('Error creating evidence directory:', error);
  }
  return testEvidenceDir;
}

// Upload evidence file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const testId = formData.get('testId') as string;
    const wcagId = formData.get('wcagId') as string;
    const evidenceType = formData.get('evidenceType') as string;
    const file = formData.get('file') as File;
    
    if (!testId || !wcagId || !evidenceType || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const testEvidenceDir = await ensureEvidenceDirectory(testId);
    
    // Generate filename: {criterionId}_{timestamp}_{originalName}
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const baseName = path.basename(file.name, fileExtension);
    const filename = `${wcagId}_${timestamp}_${baseName}${fileExtension}`;
    
    const filePath = path.join(testEvidenceDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await fs.writeFile(filePath, buffer);
    
    const evidenceInfo = {
      id: `${wcagId}_${timestamp}`,
      type: evidenceType,
      filename,
      uploadedAt: new Date().toISOString(),
      filePath: `/manual-testing-results/evidence/${testId}/${filename}`
    };
    
    return NextResponse.json(evidenceInfo);
  } catch (error) {
    console.error('Error uploading evidence:', error);
    return NextResponse.json({ error: 'Failed to upload evidence' }, { status: 500 });
  }
}

// Get evidence files for a test session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    
    if (!testId) {
      return NextResponse.json({ error: 'testId is required' }, { status: 400 });
    }
    
    const testEvidenceDir = path.join(EVIDENCE_DIR, testId);
    
    try {
      const files = await fs.readdir(testEvidenceDir);
      const evidenceFiles = files.map(file => ({
        filename: file,
        filePath: `/manual-testing-results/evidence/${testId}/${file}`,
        uploadedAt: new Date().toISOString() // We could get actual file stats if needed
      }));
      
      return NextResponse.json(evidenceFiles);
    } catch (error) {
      // Directory doesn't exist, return empty array
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error getting evidence files:', error);
    return NextResponse.json({ error: 'Failed to get evidence files' }, { status: 500 });
  }
}

// Delete evidence file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const filename = searchParams.get('filename');
    
    if (!testId || !filename) {
      return NextResponse.json({ error: 'testId and filename are required' }, { status: 400 });
    }
    
    const filePath = path.join(EVIDENCE_DIR, testId, filename);
    
    try {
      await fs.unlink(filePath);
      return NextResponse.json({ success: true });
    } catch (fileError) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting evidence file:', error);
    return NextResponse.json({ error: 'Failed to delete evidence file' }, { status: 500 });
  }
}
