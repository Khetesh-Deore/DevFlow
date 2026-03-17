import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Trophy,
  Code,
  History,
  User,
  Settings,
  PlusCircle,
  BarChart3,
  Play,
  Send,
  Moon,
  Sun,
  Home,
} from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

interface CommandAction {
  label: string;
  icon: typeof Home;
  action: () => void;
  keywords?: string;
  group: string;
}

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const actions: CommandAction[] = [
    { label: 'Home', icon: Home, action: () => go('/'), keywords: 'landing', group: 'Navigation' },
    { label: 'Dashboard', icon: LayoutDashboard, action: () => go('/dashboard'), keywords: 'contests overview', group: 'Navigation' },
    { label: 'Contests', icon: Trophy, action: () => go('/dashboard'), keywords: 'competitions', group: 'Navigation' },
    { label: 'Contest Arena', icon: Code, action: () => go('/contest/2/arena'), keywords: 'coding editor problems', group: 'Navigation' },
    { label: 'Leaderboard', icon: BarChart3, action: () => go('/contest/2/leaderboard'), keywords: 'rankings scores', group: 'Navigation' },
    { label: 'Submissions', icon: History, action: () => go('/submissions'), keywords: 'history verdicts', group: 'Navigation' },
    { label: 'Host Contest', icon: PlusCircle, action: () => go('/host/create-contest'), keywords: 'create new', group: 'Navigation' },
    { label: 'Profile', icon: User, action: () => go('/profile'), keywords: 'account stats', group: 'Navigation' },
    { label: 'Settings', icon: Settings, action: () => go('/settings'), keywords: 'preferences config', group: 'Navigation' },
    {
      label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => { toggleTheme(); setOpen(false); },
      keywords: 'theme toggle appearance',
      group: 'Actions',
    },
    { label: 'Run Code', icon: Play, action: () => setOpen(false), keywords: 'execute ctrl enter', group: 'Actions' },
    { label: 'Submit Code', icon: Send, action: () => setOpen(false), keywords: 'submit ctrl shift enter', group: 'Actions' },
  ];

  const groups = [...new Set(actions.map((a) => a.group))];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, gi) => (
          <div key={group}>
            {gi > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {actions
                .filter((a) => a.group === group)
                .map((action) => (
                  <CommandItem
                    key={action.label}
                    onSelect={action.action}
                    keywords={action.keywords ? [action.keywords] : undefined}
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    <span>{action.label}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
