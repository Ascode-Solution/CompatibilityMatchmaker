import { Link, useLocation } from "wouter";
import { Brain, BarChart3, Upload, Briefcase, History, Settings, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Upload Resume", href: "/upload-resume", icon: Upload },
  { name: "Job Descriptions", href: "/job-description", icon: Briefcase },
  { name: "Match History", href: "/match-history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <nav className={`
        fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-dark">ResumeMatch</h1>
              <p className="text-sm text-gray-500">AI Powered</p>
            </div>
          </div>
          
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a 
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                        ${isActive 
                          ? 'text-primary bg-primary/10' 
                          : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                        }
                      `}
                      onClick={onClose}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className={isActive ? 'font-medium' : ''}>{item.name}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="text-gray-600 w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 truncate">{user?.email}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </nav>
    </>
  );
}
