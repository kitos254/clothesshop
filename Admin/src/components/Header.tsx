
import { useState } from "react";
import { Search, Bell, RefreshCw, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";

interface HeaderProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export default function Header({ onRefresh, isLoading = false }: HeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const isMobile = useIsMobile();
  const { theme, setTheme, isDark } = useTheme();

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <header className="bg-background py-3 px-4 md:px-8 border-b border-border flex items-center justify-between animate-fade-in">
      <div className="flex-1">
        <h1 className="text-xl font-medium">Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-secondary hover:bg-secondary/80",
            isLoading && "animate-pulse"
          )}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>

        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-secondary hover:bg-secondary/80"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        
        <button className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-secondary hover:bg-secondary/80 relative">
          <Bell size={16} />
          <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-primary"></span>
        </button>

        <div className="h-9 relative hidden sm:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search projects..."
            className="pl-10 pr-4 py-2 h-full rounded-full text-sm bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors w-[220px] md:w-[280px]"
          />
        </div>
      </div>
    </header>
  );
}
