// Recent modules management - MongoDB-based
import { getCurrentUserId } from './favorites';

export interface RecentModule {
  title: string;
  href: string;
  ts: number;
}

// Push recent module to MongoDB
export async function pushRecent(title: string, href: string): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) {
    return;
  }

  try {
    await fetch('/api/user-profile/recent-modules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ title, href })
    });
  } catch (error) {
    console.error('Error adding recent module:', error);
  }
}

// Get recent modules from MongoDB
export async function getRecent(): Promise<RecentModule[]> {
  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }

  try {
    const response = await fetch(`/api/user-profile/recent-modules?userId=${userId}`);
    if (!response.ok) {
      console.error('Failed to fetch recent modules');
      return [];
    }
    const data = await response.json();
    // Convert MongoDB format to expected format
    return (data.recentModules || []).map((m: { title: string; href: string; timestamp: number }) => ({
      title: m.title,
      href: m.href,
      ts: m.timestamp
    }));
  } catch (error) {
    console.error('Error fetching recent modules:', error);
    return [];
  }
}
