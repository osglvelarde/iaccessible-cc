import { NextRequest, NextResponse } from 'next/server';
import * as UserProfileModel from '@/lib/models/UserProfile';
import * as UserModel from '@/lib/models/User';
import { UpdateUserProfileRequest, UserProfile } from '@/lib/types/user-profile';

// Helper to get userId from request (TODO: Replace with actual auth/session)
function getUserId(request: NextRequest): string | null {
  // For now, get from header or query param
  // In production, this should come from session/JWT token
  const userId = request.headers.get('x-user-id') || 
                 new URL(request.url).searchParams.get('userId');
  return userId;
}

// GET /api/user-profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    
    const profile = await UserProfileModel.getOrCreateUserProfile(userId);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return default profile if MongoDB is not configured
    if (error instanceof Error && error.message.includes('MongoDB')) {
      const now = new Date().toISOString();
      return NextResponse.json({
        id: '',
        userId: getUserId(request) || '',
        preferences: {
          theme: 'system',
          notifications: {
            email: true,
            sessionWarnings: true,
            moduleUpdates: false
          },
          autoSaveRecentModules: true
        },
        favorites: [],
        recentModules: [],
        moduleUsage: [],
        customSettings: {},
        createdAt: now,
        updatedAt: now
      });
    }
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT /api/user-profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const updates: UpdateUserProfileRequest = await request.json();
    
    // If updating basic user info, update users collection too
    if (updates.firstName || updates.lastName) {
      await UserModel.updateUser(userId, {
        firstName: updates.firstName,
        lastName: updates.lastName
      });
    }
    
    // Update profile (exclude firstName/lastName from profile update)
    const { firstName, lastName, ...profileUpdates } = updates;
    // Type assertion needed because UpdateUserProfileRequest uses Partial types
    const updated = await UserProfileModel.updateUserProfile(userId, profileUpdates as Partial<UserProfile>);
    
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

