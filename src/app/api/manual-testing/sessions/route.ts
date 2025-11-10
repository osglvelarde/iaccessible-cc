import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { TestSession } from '@/lib/manual-testing';

const RESULTS_DIR = path.join(process.cwd(), 'manual-testing-results');
const EVIDENCE_DIR = path.join(RESULTS_DIR, 'evidence');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
    await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Save test session
export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const session: TestSession = await request.json();
    const filePath = path.join(RESULTS_DIR, `${session.testId}.json`);
    
    await fs.writeFile(filePath, JSON.stringify(session, null, 2));
    
    return NextResponse.json({ success: true, testId: session.testId });
  } catch (error) {
    console.error('Error saving session:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

// Load test session
export async function GET(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    
    if (!testId) {
      return NextResponse.json({ error: 'testId is required' }, { status: 400 });
    }
    
    const filePath = path.join(RESULTS_DIR, `${testId}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const session: TestSession = JSON.parse(fileContent);
      return NextResponse.json(session);
    } catch {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error loading session:', error);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}

// Get all test sessions
export async function PUT() {
  try {
    await ensureDirectories();
    
    const files = await fs.readdir(RESULTS_DIR);
    const sessionFiles = files.filter(file => file.endsWith('.json'));
    
    const sessions = [];
    for (const file of sessionFiles) {
      try {
        const filePath = path.join(RESULTS_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const session: TestSession = JSON.parse(fileContent);
        sessions.push(session);
      } catch (error) {
        console.error(`Error reading session file ${file}:`, error);
      }
    }
    
    // Sort by last updated (newest first)
    sessions.sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error loading sessions:', error);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}

// Delete test session
export async function DELETE(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    
    if (!testId) {
      return NextResponse.json({ error: 'testId is required' }, { status: 400 });
    }
    
    const filePath = path.join(RESULTS_DIR, `${testId}.json`);
    const evidenceDir = path.join(EVIDENCE_DIR, testId);
    
    try {
      // Delete session file
      await fs.unlink(filePath);
      
      // Delete evidence directory if it exists
      try {
        await fs.rmdir(evidenceDir, { recursive: true });
      } catch {
        // Evidence directory might not exist, that's okay
      }
      
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
