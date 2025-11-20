import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { TestSession, exportSessionToCSV } from '@/lib/manual-testing';
import { getCriteriaForVersionAndLevel } from '@/lib/wcag-complete';

const RESULTS_DIR = path.join(process.cwd(), 'manual-testing-results');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Export test session to CSV
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
      
      // Get criteria for the session's WCAG version and level
      const criteria = getCriteriaForVersionAndLevel(session.wcagVersion, session.level);
      
      // Generate CSV
      const csvContent = exportSessionToCSV(session, criteria);
      
      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `manual-test-${testId}-${dateStr}.csv`;
      
      // Return CSV file
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (fileError) {
      console.error('Error reading session file:', fileError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}


