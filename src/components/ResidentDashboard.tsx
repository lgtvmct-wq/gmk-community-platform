import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Building, 
  Shield, 
  Check, 
  Edit2, 
  Users, 
  Calendar, 
  X, 
  Plus, 
  Trash2, 
  Mail, 
  Phone, 
  Briefcase, 
  Eye, 
  EyeOff,
  User,
  CheckCircle2,
  Search,
  Filter
} from 'lucide-react';
import { DirectoryVisibility, AdditionalMember, ResidentProfile, FamilyProfile } from '../types';

export default function ResidentDashboard() {
  const { resident, family, isDemo, updateResidentAndFamily } = useAuth();
  
  // Local notification state
  const [notiText, setNotiText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Directory and Status states
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'directory'>('dashboard');
  const [directoryResidents, setDirectoryResidents] = useState<any[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  // Filters state
  const [filterName, setFilterName] = useState('');
  const [filterFlat, setFilterFlat] = useState('');
  const [filterProfession, setFilterProfession] = useState('');
  const [filterCompany, setFilterCompany] = useState('');

  const fetchDirectory = async () => {
    setDirectoryLoading(true);
    try {
      const q = query(
        collection(db, 'residents'),
        where('directoryVisibility.isVisible', '==', true)
      );
      const qSnap = await getDocs(q);
      const residentsList = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDirectoryResidents(residentsList);
    } catch (err: any) {
      console.error("Error loading directory:", err);
    } finally {
      setDirectoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'directory') {
      fetchDirectory();
    }
  }, [activeSubTab]);

  const handleResubmitToAdmins = async () => {
    if (!family || !family.id) return;
    setResubmitting(true);
    try {
      await updateDoc(doc(db, 'families', family.id), {
        status: 'pendingApproval'
      });
      setNotiText('✓ Profile resubmitted to Admins successfully!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setNotiText('❌ Resubmission failed: ' + err.message);
    } finally {
      setResubmitting(false);
    }
  };

  // --- MODEL EDIT PROFILE STATES ---
  const [editTitle, setEditTitle] = useState('Mr.');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGender, setEditGender] = useState<'Male' | 'Female'>('Male');
  
  // Phone values
  const [editPhoneCountry, setEditPhoneCountry] = useState('+968');
  const [editPhoneDigits, setEditPhoneDigits] = useState('');
  
  // WhatsApp values
  const [isWhatsAppSame, setIsWhatsAppSame] = useState(true);
  const [editWhatsAppCountry, setEditWhatsAppCountry] = useState('+968');
  const [editWhatsAppDigits, setEditWhatsAppDigits] = useState('');

  // Professional details (conditional for Male)
  const [editProfession, setEditProfession] = useState('');
  const [editCompany, setEditCompany] = useState('');

  // Additional members list state inside modal
  const [editMembers, setEditMembers] = useState<AdditionalMember[]>([]);

  // Individual new member form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemTitle, setNewMemTitle] = useState('Mr.');
  const [newMemName, setNewMemName] = useState('');
  const [newMemRelationship, setNewMemRelationship] = useState<'Spouse' | 'Parent' | 'Child' | 'Other'>('Spouse');
  const [newMemGender, setNewMemGender] = useState<'Male' | 'Female'>('Male');
  const [newMemYearOfBirth, setNewMemYearOfBirth] = useState('');

  // Privacy states (Privacy by Design as part of settings in the profile)
  const [editIsVisible, setEditIsVisible] = useState(true);
  const [editShowPhone, setEditShowPhone] = useState(true);
  const [editShowProfession, setEditShowProfession] = useState(false);
  const [editShowCompany, setEditShowCompany] = useState(false);

  // Helper parsers for high-fidelity values
  const parseFullNameAndTitle = (fullNameStr: string) => {
    const titles = ['Mr.', 'Dr.', 'Mrs.', 'Mstr.', 'Ms.'];
    const matched = titles.find(t => fullNameStr.startsWith(t + ' '));
    if (matched) {
      return { title: matched, name: fullNameStr.slice(matched.length + 1) };
    }
    return { title: 'Mr.', name: fullNameStr };
  };

  const parsePhoneAndCountry = (phoneStr: string) => {
    const countryCodes = ['+968', '+91', '+973', '+1', '+20', '+49', '+965', '+60', '+92', '+974', '+966', '+65', '+94', '+971', '+44'];
    const matched = countryCodes.find(code => phoneStr.startsWith(code));
    if (matched) {
      return { country: matched, digits: phoneStr.slice(matched.length).trim() };
    }
    return { country: '+968', digits: phoneStr.replace(/\D/g, '') };
  };

  // Synchronise edits with original values when modal is opened
  useEffect(() => {
    if (resident) {
      const parsedFull = parseFullNameAndTitle(resident.fullName || '');
      setEditTitle(parsedFull.title);
      setEditName(parsedFull.name);
      setEditEmail(resident.email || '');
      setEditGender(resident.gender || 'Male');
      
      const parsedPhone = parsePhoneAndCountry(resident.phone || '');
      setEditPhoneCountry(parsedPhone.country);
      setEditPhoneDigits(parsedPhone.digits);

      const parsedWhatsApp = parsePhoneAndCountry(resident.whatsApp || '');
      setEditWhatsAppCountry(parsedWhatsApp.country);
      setEditWhatsAppDigits(parsedWhatsApp.digits);
      setIsWhatsAppSame(!resident.whatsApp || resident.whatsApp === resident.phone);

      setEditProfession(resident.profession || '');
      setEditCompany(resident.companyName || '');

      setEditIsVisible(resident.directoryVisibility?.isVisible !== false);
      setEditShowPhone(resident.directoryVisibility?.showPhoneNumber !== false);
      setEditShowProfession(resident.directoryVisibility?.showProfession === true);
      setEditShowCompany(resident.directoryVisibility?.showCompanyName === true);
    }

    if (family) {
      // Load actual household members or default to mock if none exist
      const loadedMembers = family.members || [
        { name: 'Smitha Rejish', relationship: 'Spouse', gender: 'Female', yearOfBirth: '' },
        { name: 'Adithya Rejish', relationship: 'Child', gender: 'Male', yearOfBirth: '2018' }
      ];
      setEditMembers(loadedMembers);
    }
  }, [resident, family, showEditModal]);

  // Handle adding family member in modal
  const handleAddMember = () => {
    if (!newMemName.trim()) return;
    
    const newMember: AdditionalMember = {
      name: `${newMemTitle} ${newMemName.trim()}`,
      relationship: newMemRelationship,
      gender: newMemGender,
      yearOfBirth: newMemRelationship === 'Child' ? newMemYearOfBirth.trim() || undefined : undefined
    };

    setEditMembers(prev => [...prev, newMember]);
    setNewMemName('');
    setNewMemYearOfBirth('');
    setShowAddForm(false);
  };

  // Handle removing family member in modal
  const handleRemoveMember = (idx: number) => {
    setEditMembers(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit profile edits
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const formattedPhone = `${editPhoneCountry} ${editPhoneDigits.replace(/\D/g, '')}`.trim();
    const formattedWhatsApp = isWhatsAppSame 
      ? formattedPhone 
      : `${editWhatsAppCountry} ${editWhatsAppDigits.replace(/\D/g, '')}`.trim();

    const updatedResident: ResidentProfile = {
      ...resident!,
      fullName: `${editTitle} ${editName.trim()}`,
      gender: editGender,
      email: editEmail.trim(),
      phone: formattedPhone,
      whatsApp: formattedWhatsApp,
      profession: editGender === 'Male' ? editProfession.trim() : undefined,
      companyName: editGender === 'Male' ? editCompany.trim() : undefined,
      directoryVisibility: {
        isVisible: editIsVisible,
        showPhoneNumber: editShowPhone,
        showProfession: editShowProfession,
        showCompanyName: editShowCompany
      }
    };

    const updatedFamily: FamilyProfile = {
      ...family!,
      members: editMembers
    };

    try {
      if (updateResidentAndFamily) {
        await updateResidentAndFamily(updatedResident, updatedFamily);
        setNotiText('✓ Profile settings updated successfully!');
        setTimeout(() => setNotiText(''), 4000);
        setShowEditModal(false);
      }
    } catch (err: any) {
      setNotiText('❌ Failed to update: ' + err.message);
    }
  };

  // Render Display list of household roster
  const displayMembers = family?.members && family.members.length > 0
    ? [
        { 
          name: resident?.fullName || 'Rejish Gopinath', 
          role: 'Primary Adult', 
          gender: resident?.gender || 'Male', 
          contact: resident?.phone || '+968 9123 4567', 
          detail: resident?.profession || 'Software Engineer' 
        },
        ...family.members.map(m => ({
          name: m.name,
          role: m.relationship,
          gender: m.gender,
          contact: '', // Spouse details/contact hidden completely on main list as we are not capturing it
          detail: m.relationship === 'Child' && m.yearOfBirth ? `Born ${m.yearOfBirth}` : '' // None is removed completely
        }))
      ]
    : [
        { 
          name: resident?.fullName || 'Rejish Gopinath', 
          role: 'Primary Adult', 
          gender: 'Male', 
          contact: resident?.phone || '+968 9123 4567', 
          detail: resident?.profession || 'Software Engineer' 
        },
        { 
          name: 'Smitha Rejish', 
          role: 'Spouse', 
          gender: 'Female', 
          contact: '', // Blank - no contact shown
          detail: ''  // Blank - no details shown
        },
        { 
          name: 'Adithya Rejish', 
          role: 'Child', 
          gender: 'Male', 
          contact: '', // Blank - no 'None' keyword shown
          detail: 'Born 2018' 
        }
      ];

  const upcomingEvents = [
    { id: 'evt1', title: 'GMAD Grand Celebration 2026', date: 'August 14, 2026', status: 'Registration Open', rate: 'Family: 15 OMR' },
    { id: 'evt2', title: 'Onam Utsav Feast 2026', date: 'September 5, 2026', status: 'Coming Soon', rate: 'Family: 20 OMR' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback notifications */}
      {notiText && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notiText}
        </div>
      )}

      {/* Admin Status Banners */}
      {family?.status === 'pendingApproval' && (
        <div className="bg-sky-50 border-2 border-sky-150 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">⏳</span>
            <div>
              <h4 className="font-display font-semibold text-sky-900 text-xs sm:text-sm">Profile Registration Awaiting Verification</h4>
              <p className="text-sky-700 text-[11px] mt-0.5 leading-relaxed">
                Your family registration for flat <strong>{family.buildingNumber && family.unitNumber ? `${family.buildingNumber} / ${family.unitNumber}` : family.flatNumber}</strong> is currently in the Admin Approvals queue. Active events passes and public directory searches will unlock once your profile is activated.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-sky-100 text-sky-800 font-extrabold uppercase px-2.5 py-1 rounded-full border border-sky-200 shrink-0 self-start sm:self-auto font-mono tracking-wider">
            Pending Approval
          </span>
        </div>
      )}

      {family?.status === 'correctionRequested' && (
        <div className="bg-amber-50 border-2 border-amber-150 rounded-2xl p-4.5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">⚠️</span>
            <div className="space-y-1 flex-1">
              <h4 className="font-display font-semibold text-amber-900 text-xs sm:text-sm">Correction Requested by Administrator</h4>
              <p className="text-amber-700 text-[11px] leading-relaxed">
                The Admin review team has returned your registration with the following guidelines. Please modify your profile settings and resubmit.
              </p>
              <div className="bg-white border border-amber-100 rounded-xl p-3.5 mt-2 text-xs font-mono font-medium text-slate-700 italic">
                "{family.correctionNotes || 'Please correct your telephone formats or list all adult household members.'}"
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1 justify-end border-t border-amber-100/30">
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Modify Registration Details
            </button>
            <button
              onClick={handleResubmitToAdmins}
              disabled={resubmitting}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
            >
              {resubmitting ? 'Submitting...' : 'Send Back for Review'}
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Greetings Hero Section with "Hi, Name!" */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Building className="w-40 h-40" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              Verified Active Member Profile
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
              <h1 className="text-xl md:text-2xl font-display font-black tracking-tight">
                Hi, {resident?.fullName?.split(' ')[1] || resident?.fullName?.split(' ')[0] || 'Resident'}!
              </h1>
              
              {/* Edit Profile Action Link under user name */}
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-350 transition cursor-pointer border border-emerald-500/15 bg-emerald-500/5 hover:bg-emerald-500/10 px-2.5 py-1 rounded-lg active:scale-95 select-none"
              >
                <Edit2 className="w-3 h-3" /> Edit Profile
              </button>
            </div>
            
            <p className="text-slate-400 text-xs mt-1.5 max-w-xl leading-relaxed">
              Welcome to the Greens Malayalee Community (GMK) Platform—the official digital home for our community located at Al Hail Greens, Muscat, Oman. Access your membership details and operational events below.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 self-start md:self-auto">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm border border-emerald-500/35">
              GMK
            </div>
            <div>
              <p className="text-slate-400 text-[9px] uppercase tracking-wider font-semibold">Unique Family Code No.</p>
              <p className="font-display font-medium text-sm text-white">{family?.gmkId || 'GMK000404'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation for Home Dashboard and Resident Directory */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition relative cursor-pointer select-none ${
            activeSubTab === 'dashboard' 
              ? 'text-slate-900 border-b-2 border-slate-900 font-extrabold' 
              : 'text-slate-405 text-slate-400 hover:text-slate-600 font-semibold'
          }`}
        >
          My Household & Events
        </button>
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition relative cursor-pointer select-none ${
            activeSubTab === 'directory' 
              ? 'text-slate-900 border-b-2 border-slate-900 font-extrabold' 
              : 'text-slate-405 text-slate-400 hover:text-slate-600 font-semibold'
          }`}
        >
          Resident Directory
        </button>
      </div>

      {activeSubTab === 'dashboard' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Official GMK Resident Membership Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="bg-gradient-to-tr from-slate-900 to-slate-800 p-4 text-white relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold text-sm tracking-tight leading-none uppercase">Greens Malayalee Community</h3>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-1">Official Member Pass</p>
                </div>
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-display font-black text-[10px] text-white shrink-0 border border-emerald-500/20">
                  GMK
                </div>
              </div>
              
              <div className="mt-8 flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Primary Holder</p>
                  <p className="font-display font-bold text-base truncate max-w-[160px]">{resident?.fullName || 'Rejish Gopinath'}</p>
                  
                  {/* Sidebar Edit Profile link for accessibility */}
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider mt-1 cursor-pointer transition flex items-center gap-1.5 select-none"
                  >
                    <Edit2 className="w-2.5 h-2.5" /> Edit Profile Details
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Flat Block No.</p>
                  <p className="font-display font-bold text-base">{family?.buildingNumber && family?.unitNumber ? `${family.buildingNumber} / ${family.unitNumber}` : (family?.flatNumber || 'R-404')}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-medium">GMK Household ID</span>
                <span className="font-mono font-bold text-slate-900">{family?.gmkId || 'GMK000404'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-medium font-sans">Verification Status</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                  <Check className="w-3 h-3" /> Approved
                </span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-slate-400 font-medium">Flat Number Allocation</span>
                <span className="font-semibold text-slate-900">{family?.buildingNumber && family?.unitNumber ? `${family.buildingNumber} / ${family.unitNumber}` : (family?.flatNumber || 'R-404')} (Active)</span>
              </div>
            </div>
          </div>
          
          {/* Active events summary badge panel */}
          <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Pass Distribution Active</p>
              <p className="text-[10px] text-slate-450 mt-0.5">Contact coordinates must remain verified to request secure QRs.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Family Details and Event Registry */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Family Members roster card (no Privacy Safeguard at the bottom, cleaner and polished) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                <h3 className="font-display font-bold text-slate-900 text-sm">Family Household Roster</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                {displayMembers.length} Total Members
              </span>
            </div>

            <div className="divide-y divide-slate-50 text-xs">
              {displayMembers.map((member, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition duration-200 hover:bg-slate-50/20 px-1 rounded-lg">
                  <div>
                    <span className="font-semibold text-slate-900 block text-sm">{member.name}</span>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                      {member.role} • {member.gender}
                    </span>
                  </div>
                  {(member.contact || member.detail) && (
                    <div className="sm:text-right">
                      {member.contact && <p className="font-mono text-slate-600 font-semibold">{member.contact}</p>}
                      {member.detail && <p className="text-[11px] text-slate-405 mt-0.5">{member.detail}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Community Events Planning Console */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Calendar className="w-5 h-5 text-slate-500" />
              <h3 className="font-display font-bold text-slate-900 text-sm">Community Events Registry</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingEvents.map((evt) => (
                <div key={evt.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50 hover:border-slate-200 transition duration-150 flex flex-col justify-between">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block ${
                      evt.status === 'Registration Open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {evt.status}
                    </span>
                    <h4 className="font-display font-bold text-slate-950 text-sm mt-2">{evt.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{evt.date}</p>
                  </div>
                  
                  {/* Deactivated Register Now button explicitly configured for Coming Soon */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 font-mono">{evt.rate}</span>
                    <button
                      disabled={evt.status !== 'Registration Open'}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                        evt.status === 'Registration Open'
                          ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer select-none'
                          : 'bg-slate-200/65 text-slate-400 cursor-not-allowed border border-slate-300/40 opacity-70'
                      }`}
                    >
                      {evt.status === 'Registration Open' ? 'Register Now' : 'Coming Soon'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
      ) : (
        /* Resident Directory Tab Content with high-fidelity Filters */
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-4">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">Resident Directory</h3>
                <p className="text-[11px] text-slate-404 text-slate-400 mt-0.5">Find and connect with fellow Greens Malayalee Community verified residents.</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500">
                <Users className="w-3.5 h-3.5" />
                <span>{directoryResidents.filter(res => {
                  const matchesName = !filterName || (res.fullName && res.fullName.toLowerCase().includes(filterName.toLowerCase()));
                  const friendlyFlat = res.buildingNumber && res.unitNumber ? `${res.buildingNumber} / ${res.unitNumber}` : (res.flatNumber || '');
                  const matchesFlat = !filterFlat || 
                    (res.flatNumber && res.flatNumber.toLowerCase().includes(filterFlat.toLowerCase())) ||
                    (friendlyFlat.toLowerCase().includes(filterFlat.toLowerCase()));
                  const matchesProfession = !filterProfession || (res.profession && res.profession.toLowerCase().includes(filterProfession.toLowerCase()));
                  const matchesCompany = !filterCompany || (res.companyName && res.companyName.toLowerCase().includes(filterCompany.toLowerCase()));
                  return matchesName && matchesFlat && matchesProfession && matchesCompany;
                }).length} Residents Found</span>
              </div>
            </div>

            {/* Filter inputs aligned nicely inside matching layout style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-hidden"
                />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Building className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Filter by flat..."
                  value={filterFlat}
                  onChange={(e) => setFilterFlat(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-hidden"
                />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-405 text-slate-400">
                  <Briefcase className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Filter by profession..."
                  value={filterProfession}
                  onChange={(e) => setFilterProfession(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-hidden"
                />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-405 text-slate-400">
                  <Building className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Filter by company..."
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Render loaded records matching visibility */}
            {directoryLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
                <span className="text-xs font-semibold">Loading residents directory...</span>
              </div>
            ) : directoryResidents.filter(res => {
              const matchesName = !filterName || (res.fullName && res.fullName.toLowerCase().includes(filterName.toLowerCase()));
              const friendlyFlat = res.buildingNumber && res.unitNumber ? `${res.buildingNumber} / ${res.unitNumber}` : (res.flatNumber || '');
              const matchesFlat = !filterFlat || 
                (res.flatNumber && res.flatNumber.toLowerCase().includes(filterFlat.toLowerCase())) ||
                (friendlyFlat.toLowerCase().includes(filterFlat.toLowerCase()));
              const matchesProfession = !filterProfession || (res.profession && res.profession.toLowerCase().includes(filterProfession.toLowerCase()));
              const matchesCompany = !filterCompany || (res.companyName && res.companyName.toLowerCase().includes(filterCompany.toLowerCase()));
              return matchesName && matchesFlat && matchesProfession && matchesCompany;
            }).length === 0 ? (
              <div className="py-12 border border-dashed border-slate-150 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-1.5">
                <span className="text-lg">📂</span>
                <p className="text-xs font-bold text-slate-500">No matching residents found</p>
                <p className="text-[10px] text-slate-400">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {directoryResidents.filter(res => {
                  const matchesName = !filterName || (res.fullName && res.fullName.toLowerCase().includes(filterName.toLowerCase()));
                  const friendlyFlat = res.buildingNumber && res.unitNumber ? `${res.buildingNumber} / ${res.unitNumber}` : (res.flatNumber || '');
                  const matchesFlat = !filterFlat || 
                    (res.flatNumber && res.flatNumber.toLowerCase().includes(filterFlat.toLowerCase())) ||
                    (friendlyFlat.toLowerCase().includes(filterFlat.toLowerCase()));
                  const matchesProfession = !filterProfession || (res.profession && res.profession.toLowerCase().includes(filterProfession.toLowerCase()));
                  const matchesCompany = !filterCompany || (res.companyName && res.companyName.toLowerCase().includes(filterCompany.toLowerCase()));
                  return matchesName && matchesFlat && matchesProfession && matchesCompany;
                }).map((resKey: any, idxKey: number) => {
                  const canShowProfession = resKey.directoryVisibility?.showProfession !== false && resKey.profession;
                  const canShowCompany = resKey.directoryVisibility?.showCompanyName !== false && resKey.companyName;
                  const canShowPhone = resKey.directoryVisibility?.showPhoneNumber !== false && resKey.phone;

                  return (
                    <div key={idxKey} className="border border-slate-100 bg-slate-50/30 hover:bg-slate-50/80 rounded-xl p-4 transition duration-150 flex flex-col justify-between gap-3 shadow-xs">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-display font-bold text-slate-900 text-sm leading-tight">{resKey.fullName}</h4>
                          <span className="text-[10px] font-mono font-bold bg-white border border-slate-150 text-slate-650 px-2.5 py-0.5 rounded-full shrink-0 shadow-3xs">
                            Flat {resKey.buildingNumber && resKey.unitNumber ? `${resKey.buildingNumber} / ${resKey.unitNumber}` : resKey.flatNumber}
                          </span>
                        </div>
                        
                        {(canShowProfession || canShowCompany) && (
                          <div className="mt-2 space-y-0.5 text-xs text-slate-500 font-medium">
                            {canShowProfession && (
                              <p className="flex items-center gap-1.5 text-slate-700">
                                <span className="inline-block w-1 h-1 bg-emerald-500 rounded-full" />
                                {resKey.profession}
                              </p>
                            )}
                            {canShowCompany && (
                              <p className="flex items-center gap-1.5 text-slate-400 text-[11px] pl-2.5">
                                at <span className="font-semibold text-slate-500">{resKey.companyName}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100/50 flex flex-wrap justify-between items-center gap-2 text-[10px]">
                        {canShowPhone ? (
                          <div className="flex items-center gap-1 text-slate-600 font-mono font-semibold">
                            <span>📱</span> {resKey.phone}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono flex items-center gap-1 bg-slate-100/40 px-1.5 py-0.5 rounded-md">🔒 Contacts Private</span>
                        )}
                        <span className="text-slate-400 font-mono">{resKey.email}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          ======= EDIT PROFILE MODAL (Everything from Onboarding) =======
          ======================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-100/90 shadow-2xl relative border-t-4 border-t-emerald-600 scrollbar-none animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Heading Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-display font-extrabold text-slate-950 text-base">Edit Resident Profile Settings</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">Update registration, dependants, and privacy bounds.</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-slate-405 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSaveProfile} className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              
              {/* SECTION A: Primary Representative Details */}
              <div className="space-y-3.5">
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-500 uppercase tracking-widest font-black border border-slate-150">
                  Primary Representative Details
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Title
                    </label>
                    <select
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:outline-hidden cursor-pointer"
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Mstr.">Mstr.</option>
                      <option value="Ms.">Ms.</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Primary Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-905 font-bold focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Representative Gender
                    </label>
                    <div className="flex gap-4 pt-1">
                      {['Male', 'Female'].map((genderStr) => (
                        <label key={genderStr} className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="edit_gender"
                            checked={editGender === genderStr}
                            onChange={() => setEditGender(genderStr as any)}
                            className="w-4 h-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          {genderStr}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Professional Email
                    </label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-905 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Primary Phone Coordinates */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Country Code
                    </label>
                    <select
                      value={editPhoneCountry}
                      onChange={(e) => setEditPhoneCountry(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      <option value="+968">Oman (+968)</option>
                      <option value="+91">India (+91)</option>
                      <option value="+973">Bahrain (+973)</option>
                      <option value="+1">US/Canada (+1)</option>
                      <option value="+965">Kuwait (+965)</option>
                      <option value="+966">Saudi Arabia (+966)</option>
                      <option value="+971">UAE (+971)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Mobile Digits <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editPhoneDigits}
                      onChange={(e) => setEditPhoneDigits(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                {/* WhatsApp configuration */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={isWhatsAppSame}
                      onChange={(e) => setIsWhatsAppSame(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="font-bold text-slate-700">WhatsApp number is same as Mobile</span>
                  </label>

                  {!isWhatsAppSame && (
                    <div className="grid grid-cols-3 gap-2 p-3 bg-emerald-50/10 border border-emerald-500/10 rounded-xl animate-in fade-in duration-200">
                      <div className="col-span-1">
                        <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          WhatsApp Code
                        </label>
                        <select
                          value={editWhatsAppCountry}
                          onChange={(e) => setEditWhatsAppCountry(e.target.value)}
                          className="w-full px-2 py-2 bg-white border border-slate-205 rounded-xl text-slate-800 text-xs font-bold cursor-pointer"
                        >
                          <option value="+968">Oman (+968)</option>
                          <option value="+91">India (+91)</option>
                          <option value="+973">Bahrain (+973)</option>
                          <option value="+1">Canada (+1)</option>
                          <option value="+971">UAE (+971)</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          WhatsApp Digits
                        </label>
                        <input
                          type="text"
                          value={editWhatsAppDigits}
                          onChange={(e) => setEditWhatsAppDigits(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 bg-white border border-slate-205 rounded-xl text-slate-900 focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: Professional Coordinates (Conditional if representative is Male) */}
              {editGender === 'Male' && (
                <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
                  <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-500 uppercase tracking-widest font-black border border-slate-150">
                    Professional Status Info
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Profession Designation <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={editGender === 'Male'}
                        value={editProfession}
                        onChange={(e) => setEditProfession(e.target.value)}
                        placeholder="e.g. Software Consultant"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-905 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={editGender === 'Male'}
                        value={editCompany}
                        onChange={(e) => setEditCompany(e.target.value)}
                        placeholder="e.g. Al Hail Energy Tech"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-905 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION C: Household Residents Catalog (Dynamic edits) */}
              <div className="space-y-3.5 pt-1">
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-500 uppercase tracking-widest font-black border border-slate-150 flex justify-between items-center">
                  <span>Household Residents Registry</span>
                  <span className="text-[10px] text-slate-400 lowercase font-semibold">{editMembers.length} listed</span>
                </div>

                {/* List current family members in form */}
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {editMembers.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-3 text-center border border-dashed rounded-xl">
                      No additional family dependants catalogued yet.
                    </p>
                  ) : (
                    editMembers.map((mem, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl transition">
                        <div>
                          <span className="font-bold text-slate-900 block text-[11px]">{mem.name}</span>
                          <span className="text-[9px] text-slate-450 font-semibold uppercase">
                            {mem.relationship} • {mem.gender} {mem.yearOfBirth ? `(Born ${mem.yearOfBirth})` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(index)}
                          className="p-1 px-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Remove family member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Subform to append family members */}
                {!showAddForm ? (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Household Resident
                  </button>
                ) : (
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex gap-1.5">
                      <select
                        value={newMemTitle}
                        onChange={(e) => setNewMemTitle(e.target.value)}
                        className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-[10.5px] font-bold focus:outline-hidden cursor-pointer"
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Mstr.">Mstr.</option>
                        <option value="Ms.">Ms.</option>
                      </select>
                      <input
                        type="text"
                        value={newMemName}
                        onChange={(e) => setNewMemName(e.target.value)}
                        placeholder="Dependent Full Name"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-905"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newMemRelationship}
                        onChange={(e) => {
                          setNewMemRelationship(e.target.value as any);
                          if (e.target.value !== 'Child') {
                            setNewMemYearOfBirth('');
                          }
                        }}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold focus:outline-hidden cursor-pointer"
                      >
                        <option value="Spouse">Spouse / Partner</option>
                        <option value="Parent">Parent</option>
                        <option value="Child">Child</option>
                        <option value="Other">Other</option>
                      </select>

                      <select
                        value={newMemGender}
                        onChange={(e) => setNewMemGender(e.target.value as any)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold focus:outline-hidden cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    {newMemRelationship === 'Child' && (
                      <div className="animate-in fade-in duration-200">
                        <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Year of Birth <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          value={newMemYearOfBirth}
                          onChange={(e) => setNewMemYearOfBirth(e.target.value.replace(/\D/g, ''))}
                          placeholder="Year of Birth (YYYY) - e.g. 2018"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden font-mono"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-2.5 py-1 text-[10px] font-bold bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="px-3 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Insert Member
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION D: Privacy by Design Settings (Integrated inside Profile settings) */}
              <div className="space-y-3 pt-1">
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-500 uppercase tracking-widest font-black border border-slate-150">
                  Privacy by Design Settings
                </div>
                
                <div className="space-y-3.5 pl-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsVisible}
                      onChange={(e) => setEditIsVisible(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block leading-tight">Show in Resident Directory</span>
                      <span className="text-[10px] text-slate-450 block mt-0.5">Allow neighboring families to view flat allocations in directory search folders.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editShowPhone}
                      onChange={(e) => setEditShowPhone(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block leading-tight">Expose Primary Phone Detail</span>
                      <span className="text-[10px] text-slate-450 block mt-0.5">Let verified residents view primary phone numbers for peer-to-peer coordinates on emergency.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editShowProfession}
                      onChange={(e) => setEditShowProfession(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block leading-tight">Highlight Profession Class</span>
                      <span className="text-[10px] text-slate-450 block mt-0.5">Make professional designations accessible for micro-mentoring resources.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editShowCompany}
                      onChange={(e) => setEditShowCompany(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block leading-tight">Showcase Workplace Brand</span>
                      <span className="text-[10px] text-slate-450 block mt-0.5">Share company branding with the professional resident community directory.</span>
                    </div>
                  </label>
                </div>
              </div>

            </form>

            {/* Modal Bottom Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4.5 py-2.5 bg-white border border-slate-205 hover:bg-slate-50 text-slate-700 rounded-xl font-bold uppercase tracking-wider select-none active:scale-98"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-bold uppercase tracking-wider transition select-none shadow-md shadow-emerald-500/10 active:scale-98"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
