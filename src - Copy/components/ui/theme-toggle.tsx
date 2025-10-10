import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // On mount, check for saved theme or system preference
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
      className="gap-2"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4 text-yellow-400" aria-hidden="true" />
          Light
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-blue-600" aria-hidden="true" />
          Dark
        </>
      )}
    </Button>
  );
};
