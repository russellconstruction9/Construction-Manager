import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ProfileMenu from './ProfileMenu';
import { Link } from 'react-router-dom';
import { SccLogoIcon } from './icons/Icons';
import PWAFeatures from './PWAFeatures';
import ChatAgent from './ChatAgent';
import DebugInfo from './DebugInfo';
import ErrorBoundary from './ErrorBoundary';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen font-sans text-gray-900 bg-gray-100">
      <ErrorBoundary fallback={<div className="p-4 text-red-600">Sidebar error</div>}>
        <div className="hidden md:flex">
          <Sidebar />
        </div>
      </ErrorBoundary>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ErrorBoundary fallback={<div className="h-16 bg-red-100 flex items-center px-4">Header error</div>}>
          <header className="flex-shrink-0 bg-white border-b-4 border-primary-navy">
              <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                  {/* Mobile Logo - hidden on medium screens and up */}
                  <Link to="/" className="flex items-center gap-2 md:hidden">
                      <SccLogoIcon className="w-8 h-8 text-blue-600" />
                      <span className="font-bold text-lg text-primary-navy">SCC</span>
                  </Link>

                  {/* Spacer for desktop layout to push user switcher right */}
                  <div className="hidden md:flex flex-1"></div>
                  
                  <div className="flex items-center gap-4">
                      <ErrorBoundary fallback={<div className="text-sm text-red-500">Chat Error</div>}>
                        <ChatAgent />
                      </ErrorBoundary>
                      <ErrorBoundary fallback={<div className="text-sm text-red-500">Profile Error</div>}>
                        <ProfileMenu />
                      </ErrorBoundary>
                  </div>
              </div>
          </header>
        </ErrorBoundary>
        
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="p-4 sm:p-6 lg:p-8">
              <ErrorBoundary fallback={
                <div className="text-center py-10">
                  <h2 className="text-xl font-bold text-gray-800">Content Error</h2>
                  <p className="mt-2 text-gray-600">Unable to load this page. Please try refreshing or navigating to another page.</p>
                </div>
              }>
                {children}
              </ErrorBoundary>
            </div>
        </main>
      </div>
      
      <ErrorBoundary fallback={<div className="fixed bottom-0 left-0 right-0 bg-red-100 p-2 text-center">Navigation error</div>}>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </ErrorBoundary>
      
      <PWAFeatures />
      {process.env.NODE_ENV === 'development' && <DebugInfo />}
    </div>
  );
};

export default Layout;