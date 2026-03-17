import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import AppSidebar from '@/components/AppSidebar';
import { cn } from '@/lib/utils';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex relative">
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
        {/* Sidebar */}
        <div
          className={cn(
            'fixed top-14 left-0 z-40 lg:static lg:z-auto transition-transform duration-300 lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <AppSidebar collapsed={false} onToggle={() => setSidebarOpen(false)} />
        </div>
        <main className="flex-1 overflow-auto min-w-0">
          <AnimatePresence mode="wait">
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
