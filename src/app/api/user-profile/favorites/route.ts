import { NextRequest, NextResponse } from 'next/server';
import * as UserProfileModel from '@/lib/models/UserProfile';

// Helper to get userId from request
function getUserId(request: NextRequest): string | null {
  const userId = request.headers.get('x-user-id') || 
                 new URL(request.url).searchParams.get('userId');
  return userId;
}

// GET /api/user-profile/favorites - Get user favorites
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    
    const profile = await UserProfileModel.getOrCreateUserProfile(userId);
    return NextResponse.json({ favorites: profile.favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/user-profile/favorites - Add or remove favorite
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const { moduleKey, title, action } = await request.json();
    
    if (!moduleKey) {
      return NextResponse.json({ error: 'moduleKey is required' }, { status: 400 });
    }
    
    let updated;
    if (action === 'remove' || action === 'toggle') {
      const profile = await UserProfileModel.getOrCreateUserProfile(userId);
      const isFavorited = profile.favorites.some(f => f.moduleKey === moduleKey);
      
      if (action === 'remove' || (action === 'toggle' && isFavorited)) {
        updated = await UserProfileModel.removeFavorite(userId, moduleKey);
      } else if (action === 'toggle' && !isFavorited) {
        updated = await UserProfileModel.addFavorite(userId, moduleKey, title || moduleKey);
      }
    } else {
      // Default: add
      updated = await UserProfileModel.addFavorite(userId, moduleKey, title || moduleKey);
    }
    
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update favorites' }, { status: 500 });
    }
    
    return NextResponse.json({ favorites: updated.favorites });
  } catch (error) {
    console.error('Error updating favorites:', error);
    return NextResponse.json({ error: 'Failed to update favorites' }, { status: 500 });
  }
}




