import { NextRequest, NextResponse } from 'next/server';
import * as UserProfileModel from '@/lib/models/UserProfile';

// Helper to get userId from request
function getUserId(request: NextRequest): string | null {
  const userId = request.headers.get('x-user-id') || 
                 new URL(request.url).searchParams.get('userId');
  return userId;
}

// POST /api/user-profile/module-usage - Track module usage
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const { moduleKey } = await request.json();
    
    if (!moduleKey) {
      return NextResponse.json({ error: 'moduleKey is required' }, { status: 400 });
    }
    
    const updated = await UserProfileModel.trackModuleUsage(userId, moduleKey);
    
    if (!updated) {
      return NextResponse.json({ error: 'Failed to track module usage' }, { status: 500 });
    }
    
    return NextResponse.json({ moduleUsage: updated.moduleUsage });
  } catch (error) {
    console.error('Error tracking module usage:', error);
    return NextResponse.json({ error: 'Failed to track module usage' }, { status: 500 });
  }
}



