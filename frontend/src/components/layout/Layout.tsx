import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { HelpChatWidget } from '@/components/help/HelpChatWidget';

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

export function Layout() {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  const handleToggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={handleCloseMobileSidebar}
      />
      <Header
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        onToggleMobileSidebar={handleToggleMobileSidebar}
      />

      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          isMobile ? 'pl-0' : sidebarCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
      <HelpChatWidget />
      <FeedbackButton />
    </div>
  );
}
