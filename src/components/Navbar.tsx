import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield, Building, ChevronDown, Bell, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
}

export default function Navbar({ currentRole, onChangeRole }: NavbarProps) {
  const { profile, logout, family } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);

  const availableRoles = profile?.roles || [];

  const roleLabels: Record<UserRole, string> = {
    resident: 'Resident',
    admin: 'Administrator',
    superAdmin: 'Super Admin',
    president: 'President / VP Officer',
    vicePresident: 'President / VP Officer',
    eventDirector: 'Event Director'
  };

  const roleColors: Record<UserRole, string> = {
    resident: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    superAdmin: 'bg-purple-50 text-purple-700 border-purple-200',
    president: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    vicePresident: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    eventDirector: 'bg-orange-50 text-orange-700 border-orange-200'
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Brand/Logo Section */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-700 text-white border border-amber-500/30 rounded-xl flex items-center justify-center font-display font-black text-sm shadow-sm">
                GMK
              </div>
              <div>
                <span className="font-display font-bold text-slate-950 text-base tracking-tight block leading-none">
                  GMK Community Platform
                </span>
                <span className="text-[9px] font-semibold text-slate-400 block tracking-wider uppercase mt-1">
                  Al Hail Greens, Muscat, Oman
                </span>
              </div>
            </div>

            {/* Role Switcher tabs if multiple roles matched */}
            {availableRoles.length > 1 && (
              <div className="hidden md:ml-8 md:flex md:space-x-1 bg-slate-100 p-1 rounded-lg">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => onChangeRole(role)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      currentRole === role
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {roleLabels[role] || role}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Tools/Persona details */}
          <div className="flex items-center gap-4">
            
            {/* Verification Status Banner if resident */}
            {family && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50/50 text-indigo-700 border border-indigo-100/60">
                <Building className="w-3.5 h-3.5" />
                Flat {family.buildingNumber && family.unitNumber ? `${family.buildingNumber} / ${family.unitNumber}` : family.flatNumber} • {family.gmkId || 'Pending Approval'}
              </span>
            )}

            {/* Current Active Context Badge */}
            <span className={`inline-flex items-center border px-2.5 py-1 rounded-lg text-xs font-medium ${roleColors[currentRole]}`}>
              <Shield className="w-3 h-3 mr-1" />
              {roleLabels[currentRole]}
            </span>

            {/* Notifications panel dropdown triggers */}
            <div className="relative">
              <button 
                onClick={() => setNotiOpen(!notiOpen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
              >
                <span className="sr-only">Notifications</span>
                <Bell className="w-5 h-5" />
              </button>
              
              {notiOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 text-slate-800 z-50 text-xs">
                  <div className="px-3 py-2 font-semibold border-b border-slate-50 text-slate-500 flex justify-between items-center bg-slate-50/50">
                    <span>Community Notifications</span>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                    <div className="p-3 hover:bg-slate-50 transition duration-150">
                      <p className="font-semibold text-slate-900">🔔 Upcoming Event Configured</p>
                      <p className="text-slate-500 mt-1">Onam 2026 registration will be opened soon by admins.</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">Just now</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Account Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 py-1 px-1.5 rounded-xl hover:bg-slate-50 transition duration-200 text-slate-700"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-semibold flex items-center justify-center text-xs tracking-wider shadow-inner uppercase">
                  {family?.buildingNumber ? family.buildingNumber.slice(0, 5) : (family?.flatNumber || 'GMK').slice(0, 3)}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                  <div className="px-4 py-2 border-b border-slate-50">
                    <p className="font-bold text-slate-900 text-sm truncate">{profile?.email}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5 truncate uppercase">Flat Number: {family?.buildingNumber && family?.unitNumber ? `${family.buildingNumber} / ${family.unitNumber}` : (family?.flatNumber || 'N/A')}</p>
                  </div>
                  
                  {/* Switch Roles dropdown sections for mobile / nested roles */}
                  {availableRoles.length > 1 && (
                    <div className="px-2 py-1.5 border-b border-slate-50 bg-slate-50/50 md:hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-2 mb-1">Switch Perspective</p>
                      {availableRoles.map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            onChangeRole(role);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-md font-medium transition ${
                            currentRole === role ? 'bg-slate-100 text-slate-950 font-bold' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {roleLabels[role]}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="p-1">
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-rose-500 text-left font-medium transition duration-150"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out Account
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
