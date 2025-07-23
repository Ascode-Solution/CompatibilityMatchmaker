import { Menu, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  onNewAnalysis?: () => void;
}

export function Header({ title, subtitle, onMenuClick, onNewAnalysis }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-dark">{title}</h1>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5 text-gray-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full"></span>
          </Button>
          
          {onNewAnalysis && (
            <Button onClick={onNewAnalysis} className="bg-primary hover:bg-primary-dark">
              <Plus className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
