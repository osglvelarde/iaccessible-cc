"use client";
import { getRecent } from "@/lib/recent-modules";
export default function RecentModules({ className="" }:{ className?:string }) {
  const items = typeof window !== "undefined" ? getRecent() : [];
  if (!items.length) return null;
  return (
    <div className={className} aria-labelledby="recent-title">
      <h2 id="recent-title" className="text-lg font-medium mb-2">Recently opened modules</h2>
      <ul className="flex flex-wrap gap-3">
        {items.map(i => (
          <li key={i.href}>
            <a className="underline underline-offset-4" href={i.href} target="_blank" rel="noopener noreferrer" aria-label={`${i.title} — opens in a new tab`}>
              {i.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

