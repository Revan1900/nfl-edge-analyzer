import { Trophy } from "lucide-react";
import { RefreshCountdown } from "./RefreshCountdown";

export const Header = () => {
  return (
    <header className="bg-gradient-primary text-primary-foreground shadow-elevated sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">NFL Analytics Pro</h1>
              <p className="text-xs text-primary-foreground/80">Powered by AI • Informational Only</p>
            </div>
          </div>
          
          <RefreshCountdown />
        </div>
      </div>
    </header>
  );
};
