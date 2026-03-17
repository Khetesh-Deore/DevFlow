import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Trophy, Code, History, PlusCircle, ChevronLeft, ChevronRight, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Contests', icon: Trophy, path: '/dashboard' },
  { title: 'Arena', icon: Code, path: '/contest/2/arena' },
  { title: 'Submissions', icon: History, path: '/submissions' },
  { title: 'Host Contest', icon: PlusCircle, path: '/host/create-contest' },
  { title: 'Profile', icon: User, path: '/profile' },
  { title: 'Settings', icon: Settings, path: '/settings' },
];

const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'h-[calc(100vh-3.5rem)] bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 sticky top-14',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === '/dashboard' && location.pathname.startsWith('/contest'));
          return (
            <Link key={item.title} to={item.path}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" onClick={onToggle} className="w-full text-sidebar-foreground hover:text-sidebar-accent-foreground">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
