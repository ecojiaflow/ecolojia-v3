import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { useDeviceContext } from '../../hooks/useDeviceContext';
import Footer from '../Footer';

const Layout: React.FC = () => {
  const { isMobile } = useDeviceContext();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Main Content - padding bottom pour mobile */}
        <main className={`flex-1 ${isMobile ? 'pb-20' : ''}`}>
          <Outlet />
        </main>

        {/* Footer - masqu sur mobile */}
        <footer className={`${isMobile ? 'hidden' : 'block'}`}>
          <Footer />
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default Layout;