import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const handleRefresh = async () => {
    try {
      // Remove auth refresh - no backend anymore
      console.log('Refresh triggered (no backend implementation)');
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <div className="h-screen bg-background overflow-hidden fixed inset-0">
      <div className="flex h-full">
        {/* Desktop Sidebar */}
        {!isMobile && <Sidebar />}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <Header onRefresh={handleRefresh} />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-0.5 md:p-4 pb-20 lg:pb-6">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default DashboardLayout;
