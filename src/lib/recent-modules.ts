const KEY = "cc.recentModules.v1";
export function pushRecent(title: string, href: string) {
    const now = Date.now();
    const item = { title, href, ts: now };
    const list = getRecent().filter(x => x.href !== href);
    list.unshift(item);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 6)));
}
export function getRecent(): { title: string; href: string; ts: number }[] {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

