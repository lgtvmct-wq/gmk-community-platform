import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthLayout from './components/AuthLayout';
import ResidentDashboard from './components/ResidentDashboard';
import AdminDashboard from './components/AdminDashboard';
import EventDirectorDashboard from './components/EventDirectorDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import PresidentDashboard from './components/PresidentDashboard';
import { UserRole } from './types';
import { Shield, LayoutDashboard, Clock } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, isDemo } = useAuth();
  
  // Track current selected role context if the user has multiple roles (RBAC support)
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  // Synchronize current role context when profile details load
  useEffect(() => {
    if (profile && profile.roles && profile.roles.length > 0) {
      // Default to their primary role
      setCurrentRole(profile.roles[0]);
    } else {
      setCurrentRole(null);
    }
  }, [profile]);

  // Loading Screen Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>
            <p className="font-display font-bold text-slate-950 text-sm tracking-tight">GMK Platform Setup</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Initializing securely...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not Authenticated -> Show beautiful Login controls
  if (!user || !profile || !currentRole) {
    return <AuthLayout />;
  }

  // Select appropriate layout panel based on active perspective role context
  const renderActiveDashboard = () => {
    switch (currentRole) {
      case 'resident':
        return <ResidentDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'eventDirector':
        return <EventDirectorDashboard />;
      case 'superAdmin':
        return <SuperAdminDashboard />;
      case 'president':
      case 'vicePresident':
        return <PresidentDashboard />;
      default:
        return (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center max-w-sm mx-auto shadow-xs">
            <Shield className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-display font-bold text-slate-900 text-sm">Awaiting Authorization</h3>
            <p className="text-xs text-slate-500 mt-2">
              Your profile is registered but has no designated layout. Please request administrative verification support.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      
      {/* Dynamic Nav Controls */}
      <Navbar currentRole={currentRole} onChangeRole={setCurrentRole} />

      {/* Main container content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
        
        {renderActiveDashboard()}

      </main>

      {/* Branded Footer details */}
      <footer className="bg-white border-t border-slate-100 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-medium text-slate-400">
          <div className="flex items-center gap-1.5 uppercase tracking-wide">
            <span>© 2026 Greens Malayalee Community (GMK) Platform</span>
            <span>•</span>
            <span className="text-slate-500 font-bold">Oman</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>UTC Server: 2026-05-31 05:14:00</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
