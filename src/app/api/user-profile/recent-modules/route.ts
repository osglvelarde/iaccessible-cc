import { NextRequest, NextResponse } from 'next/server';
import * as UserProfileModel from '@/lib/models/UserProfile';

// Helper to get userId from request
function getUserId(request: NextRequest): string | null {
  const userId = request.headers.get('x-user-id') || 
                 new URL(request.url).searchParams.get('userId');
  return userId;
}

// GET /api/user-profile/recent-modules - Get recent modules
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    
    const profile = await UserProfileModel.getOrCreateUserProfile(userId);
    return NextResponse.json({ recentModules: profile.recentModules || [] });
  } catch (error) {
    console.error('Error fetching recent modules:', error);
    // Return empty array if MongoDB is not configured
    if (error instanceof Error && error.message.includes('MongoDB')) {
      return NextResponse.json({ recentModules: [] });
    }
    return NextResponse.json({ recentModules: [] }, { status: 200 });
  }
}

// POST /api/user-profile/recent-modules - Add recent module
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const { title, href } = await request.json();
    
    if (!title || !href) {
      return NextResponse.json({ error: 'title and href are required' }, { status: 400 });
    }
    
    const updated = await UserProfileModel.addRecentModule(userId, title, href);
    
    if (!updated) {
      // Return success with empty array if MongoDB is not configured
      return NextResponse.json({ recentModules: [] });
    }
    
    return NextResponse.json({ recentModules: updated.recentModules || [] });
  } catch (error) {
    console.error('Error updating recent modules:', error);
    // Return empty array if MongoDB is not configured
    if (error instanceof Error && error.message.includes('MongoDB')) {
      return NextResponse.json({ recentModules: [] });
    }
    return NextResponse.json({ recentModules: [] }, { status: 200 });
  }
}




