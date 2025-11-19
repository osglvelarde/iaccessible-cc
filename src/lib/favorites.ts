// Favorites management utilities - MongoDB-based
import { FavoriteModule } from './types/user-profile';

let currentUserId: string | null = null;

// Set the current user ID (called from AuthProvider)
export function setCurrentUserId(userId: string | null) {
  currentUserId = userId;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

// Get favorites from MongoDB
export async function getFavorites(): Promise<FavoriteModule[]> {
  if (!currentUserId) {
    return [];
  }

  try {
    const response = await fetch(`/api/user-profile/favorites?userId=${currentUserId}`);
    if (!response.ok) {
      console.error('Failed to fetch favorites');
      return [];
    }
    const data = await response.json();
    return data.favorites || [];
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}

// Add favorite to MongoDB
export async function addFavorite(moduleKey: string, title: string): Promise<void> {
  if (!currentUserId) {
    return;
  }

  try {
    await fetch('/api/user-profile/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId
      },
      body: JSON.stringify({ moduleKey, title, action: 'add' })
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
}

// Remove favorite from MongoDB
export async function removeFavorite(moduleKey: string): Promise<void> {
  if (!currentUserId) {
    return;
  }

  try {
    await fetch('/api/user-profile/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId
      },
      body: JSON.stringify({ moduleKey, action: 'remove' })
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
}

// Toggle favorite in MongoDB
export async function toggleFavorite(moduleKey: string, title: string): Promise<boolean> {
  if (!currentUserId) {
    return false;
  }

  try {
    const response = await fetch('/api/user-profile/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId
      },
      body: JSON.stringify({ moduleKey, title, action: 'toggle' })
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.favorites?.some((f: FavoriteModule) => f.moduleKey === moduleKey) || false;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
}

// Check if module is favorited
export async function isFavorited(moduleKey: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some(f => f.moduleKey === moduleKey);
}
