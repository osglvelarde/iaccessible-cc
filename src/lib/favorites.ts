// Favorites management utilities
export interface FavoriteModule {
    moduleKey: string;
    title: string;
    addedAt: string;
}

const FAVORITES_KEY = "cc.favorites";

export function getFavorites(): FavoriteModule[] {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function addFavorite(moduleKey: string, title: string): void {
    if (typeof window === "undefined") return;

    const favorites = getFavorites();
    if (!favorites.find(f => f.moduleKey === moduleKey)) {
        const newFavorite: FavoriteModule = {
            moduleKey,
            title,
            addedAt: new Date().toISOString()
        };

        const updatedFavorites = [...favorites, newFavorite];
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    }
}

export function removeFavorite(moduleKey: string): void {
    if (typeof window === "undefined") return;

    const favorites = getFavorites();
    const updatedFavorites = favorites.filter(f => f.moduleKey !== moduleKey);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
}

export function toggleFavorite(moduleKey: string, title: string): boolean {
    const favorites = getFavorites();
    const isFavorited = favorites.some(f => f.moduleKey === moduleKey);

    if (isFavorited) {
        removeFavorite(moduleKey);
        return false;
    } else {
        addFavorite(moduleKey, title);
        return true;
    }
}

export function isFavorited(moduleKey: string): boolean {
    const favorites = getFavorites();
    return favorites.some(f => f.moduleKey === moduleKey);
}
