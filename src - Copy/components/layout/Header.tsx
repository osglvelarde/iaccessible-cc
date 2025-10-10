import { Search, User, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const Header = () => {
  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <span className="sr-only">Accessibility Testing Tool - </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 32 32" aria-hidden="true">
              <circle cx="16" cy="16" r="16" fill="#2563eb"/>
              <text
                x="16"
                y="16"
                textAnchor="middle"
                fill="#fff"
                fontSize="15"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
                alignmentBaseline="middle"
                dominantBaseline="middle"
              >iA</text>
            </svg>
            iAccessible Manual Testing
          </h1>
          
          <div className="relative ml-8 hidden md:block">
            <Search 
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" 
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search reports, pages, findings..."
              className="w-80 pl-10"
              aria-label="Search reports, pages, and findings"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex"
            aria-label="Help and documentation"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Help
          </Button>

          {/* Theme Toggle Button */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-2"
                aria-label="User menu"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="hidden md:inline">Test User</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium">
                Test User
              </div>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                tester@example.com
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
