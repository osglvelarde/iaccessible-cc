export interface UserProfile {
  id: string;
  userId: string; // Reference to users collection
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      sessionWarnings: boolean;
      moduleUpdates: boolean;
    };
    autoSaveRecentModules: boolean;
    language?: string;
    timezone?: string;
  };
  favorites: {
    moduleKey: string;
    title: string;
    addedAt: string;
  }[];
  recentModules: {
    title: string;
    href: string;
    timestamp: number;
  }[];
  moduleUsage: {
    moduleKey: string;
    lastUsed?: string;
    usageCount: number;
  }[];
  customSettings?: Record<string, any>; // For extensibility
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  preferences?: UserProfile['preferences'];
  favorites?: UserProfile['favorites'];
  recentModules?: UserProfile['recentModules'];
  moduleUsage?: UserProfile['moduleUsage'];
  customSettings?: Record<string, any>;
}

export interface FavoriteModule {
  moduleKey: string;
  title: string;
  addedAt: string;
}

export interface RecentModule {
  title: string;
  href: string;
  timestamp: number;
}

export interface ModuleUsage {
  moduleKey: string;
  lastUsed?: string;
  usageCount: number;
}

