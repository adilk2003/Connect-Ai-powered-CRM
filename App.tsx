
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Contacts from './components/Contacts';
import Pipeline from './components/Pipeline';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import Documents from './components/Documents';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Email from './components/Email';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import InviteTeamModal from './components/InviteTeamModal';
import AiAssistant from './components/AiAssistant';
import { View, UserProfile } from './types';
import { ToastProvider } from './components/Toast';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Global User State
  const [userProfile, setUserProfile] = useState<UserProfile>({
      name: 'Loading...',
      email: '...',
      title: '...',
      avatar: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
             await loadUserProfile();
             setIsAuthenticated(true);
        } catch (error) {
            console.error("Auth check failed:", error);
            localStorage.removeItem('authToken');
            setIsAuthenticated(false);
        }
    } else {
        setIsAuthenticated(false);
    }
  };

  const loadUserProfile = async () => {
      try {
          const profile = await dataService.getUser();
          
          if (profile && profile.name) {
             setUserProfile(profile);
          } else {
             // If we have a token but getting user failed (e.g. user deleted on backend), we should fail
             throw new Error("Invalid profile data");
          }
      } catch (e) {
          console.error("Failed to load user profile", e);
          throw e; // Propagate to checkAuth to handle logout
      }
  };

  const handleUpdateProfile = (updated: UserProfile) => {
      setUserProfile(updated);
  };

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Email':
        return <Email />;
      case 'Contacts':
        return <Contacts />;
      case 'Pipeline':
        return <Pipeline />;
      case 'Tasks':
        return <Tasks />;
      case 'Calendar':
        return <Calendar />;
      case 'Documents':
        return <Documents />;
      case 'Reports':
        return <Reports />;
      case 'Settings':
        return <Settings user={userProfile} onUpdateUser={handleUpdateProfile} />;
      default:
        return <Dashboard />;
    }
  };

  const handleAuthSuccess = async () => {
    await checkAuth();
    setCurrentView('Dashboard');
  };
  
  const handleLogout = async () => {
    await dataService.logout();
    setIsAuthenticated(false);
    setAuthPage('login');
    setUserProfile({ name: '', email: '', title: '', avatar: '' });
  }

  const MainContent = () => (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          currentView={currentView}
          setCurrentView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }}
          onInviteClick={() => setIsInviteModalOpen(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          currentView={currentView}
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
          onInviteClick={() => setIsInviteModalOpen(true)}
          onMenuClick={() => setIsSidebarOpen(true)}
          user={userProfile}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
             {renderView()}
          </div>
        </main>
      </div>

      <InviteTeamModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
      />
      <AiAssistant />
    </div>
  );

  return (
    <ToastProvider>
      {!isAuthenticated ? (
        authPage === 'login' ? (
          <LoginPage onSwitchToSignup={() => setAuthPage('signup')} onLogin={handleAuthSuccess} />
        ) : (
          <SignupPage onSwitchToLogin={() => setAuthPage('login')} onSignup={handleAuthSuccess} />
        )
      ) : (
        <MainContent />
      )}
    </ToastProvider>
  );
};

export default App;
