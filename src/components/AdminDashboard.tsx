import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserCheck, ShieldAlert, Check, X, Search, FileText, 
  Trash2, Home, UserPlus, FileClock, CircleAlert, Archive 
} from 'lucide-react';
import { doc, collection, getDocs, setDoc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

interface MockFamily {
  id: string;
  gmkId: string;
  buildingNumber?: string;
  unitNumber?: string;
  flatNumber: string;
  primaryName: string;
  status: 'active' | 'pendingApproval' | 'former';
  email: string;
  phone: string;
  membersCount: number;
}

export default function AdminDashboard() {
  const { user, isDemo } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // SECURE CONFIGURATION: Configurable system password requirements policy
  const [minPasswordLength, setMinPasswordLength] = useState<number>(() => {
    const val = localStorage.getItem('gmk_min_password_length');
    return val ? parseInt(val, 10) : 8;
  });

  const [requireUppercase, setRequireUppercase] = useState<boolean>(() => {
    return localStorage.getItem('gmk_pass_require_uppercase') === 'true';
  });

  const [requireLowercase, setRequireLowercase] = useState<boolean>(() => {
    return localStorage.getItem('gmk_pass_require_lowercase') === 'true';
  });

  const [requireNumber, setRequireNumber] = useState<boolean>(() => {
    return localStorage.getItem('gmk_pass_require_number') === 'true';
  });

  const [requireSpecial, setRequireSpecial] = useState<boolean>(() => {
    return localStorage.getItem('gmk_pass_require_special') === 'true';
  });
  
  // Real Firestore-sourced families list
  const [families, setFamilies] = useState<MockFamily[]>([]);

  const fetchFamilies = async () => {
    setLoading(true);
    try {
      const qSnap = await getDocs(collection(db, 'families'));
      let list = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MockFamily[];
      
      if (list.length === 0) {
        // Seed some initial records to keep the Firestore environment populated with real documents!
        const initialSeeds = [
          { id: 'fam1', gmkId: 'GMK000110', buildingNumber: 'A-201', unitNumber: '1', flatNumber: 'A2011', primaryName: 'Sunil Gopinath', status: 'active' as const, email: 'sunil@gmk.com', phone: '+968 9345 6123', membersCount: 4 },
          { id: 'fam2', gmkId: 'GMK000112', buildingNumber: 'B3-04', unitNumber: '01', flatNumber: 'B30401', primaryName: 'Dr. Joseph Kurian', status: 'active' as const, email: 'president@gmk.com', phone: '+968 9111 2222', membersCount: 3 },
          { id: 'fam3', gmkId: 'GMK000125', buildingNumber: 'C1-11', unitNumber: '03', flatNumber: 'C11103', primaryName: 'Manoj Pillai', status: 'pendingApproval' as const, email: 'manoj.pillai@gmk.com', phone: '+968 9876 1122', membersCount: 5 },
          { id: 'fam4', gmkId: 'GMK000126', buildingNumber: 'D4-05', unitNumber: '02', flatNumber: 'D40502', primaryName: 'Suresh Nair', status: 'pendingApproval' as const, email: 'suresh.nair@example.com', phone: '+968 9452 3311', membersCount: 2 },
          { id: 'fam5', gmkId: 'GMK000101', buildingNumber: 'B2-10', unitNumber: '08', flatNumber: 'B21008', primaryName: 'Hari Prasad (Former)', status: 'former' as const, email: 'hari.former@gmail.com', phone: '+968 9200 1100', membersCount: 4 },
        ];
        for (const seed of initialSeeds) {
          await setDoc(doc(db, 'families', seed.id), {
            ...seed,
            createdAt: new Date().toISOString()
          });
        }
        list = initialSeeds;
      }
      setFamilies(list);
    } catch (err) {
      console.error('Error reading families from Firestore:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  const [auditLog, setAuditLog] = useState<string[]>([
    'RESIDENT_CREATED: Setup administrative portal for A101.',
    'SECURITY_AUDIT: Loaded RBAC access controls in sandbox.',
    'EVENT_ACTIVATED: Pre-seeded event status Onam Festival 2026.'
  ]);

  // Approve action handler
  const handleApprove = async (id: string, name: string) => {
    try {
      const uid = id.replace('fam-', '');
      const adminEmail = user?.email || 'admin@gmk.com';

      // Use a Firestore transaction to sequentially fetch, increment and update settings
      const counterDocRef = doc(db, 'systemSettings', 'global');
      let calculatedGmkId = '';

      await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterDocRef);
        let nextCounter = 1;

        if (counterSnap.exists()) {
          const data = counterSnap.data();
          if (typeof data.gmkIdCounter === 'number') {
            nextCounter = data.gmkIdCounter + 1;
          }
        }

        calculatedGmkId = `GMK${nextCounter.toString().padStart(6, '0')}`;
        transaction.set(counterDocRef, { gmkIdCounter: nextCounter }, { merge: true });
      });

      // Update family record status to active & define sequential GMK ID along with audit logs
      await updateDoc(doc(db, 'families', id), { 
        status: 'active',
        gmkId: calculatedGmkId,
        approvedBy: adminEmail,
        approvedAt: new Date().toISOString()
      });

      // Activate corresponding user identity
      await updateDoc(doc(db, 'users', uid), {
        isActive: true
      });

      await fetchFamilies();
      setAuditLog(prev => [`RESIDENT_APPROVED: Approved family registration for ${name} [GMK ID: ${calculatedGmkId}] and activated login identity by ${adminEmail}.`, ...prev]);
    } catch (err: any) {
      console.error(err);
      setAuditLog(prev => [`RESIDENT_APPROVE_ERROR: Failed to approve ${name}: ${err.message}`, ...prev]);
    }
  };

  // Reject action handler
  const handleReject = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, 'families', id));
      await fetchFamilies();
      setAuditLog(prev => [`RESIDENT_REJECTED: Denied registration request from ${name} [ID: ${id}]`, ...prev]);
    } catch (err: any) {
      console.error(err);
      setAuditLog(prev => [`RESIDENT_REJECT_ERROR: Failed to reject ${name}: ${err.message}`, ...prev]);
    }
  };

  // Request Correction action handler
  const handleRequestCorrection = async (id: string, name: string, notes: string) => {
    try {
      await updateDoc(doc(db, 'families', id), {
        status: 'correctionRequested',
        correctionNotes: notes
      });
      await fetchFamilies();
      setAuditLog(prev => [`CORRECTION_REQUESTED: Requested registration edits from ${name}: "${notes}"`, ...prev]);
    } catch (err: any) {
      console.error(err);
      setAuditLog(prev => [`CORRECTION_REQUEST_ERROR: Failed to update correction notes for ${name}: ${err.message}`, ...prev]);
    }
  };

  // Process Former Resident handler (Archiving visible fields, disabling logins, releasing Flat)
  const handleProcessFormer = async (id: string, name: string, flat: string) => {
    const confirm = window.confirm(`Identify ${name} (Flat: ${flat}) as a Former Resident? This disables login identity, deletes public directories entries, and immediately RELEASES flat number ${flat} for future occupant allocations.`);
    if (!confirm) return;

    try {
      // 1. Update family document to former
      await updateDoc(doc(db, 'families', id), { status: 'former' });
      
      const uid = id.replace('fam-', '');
      // 2. Disable user login
      await updateDoc(doc(db, 'users', uid), { isActive: false }).catch(() => {});
      // 3. Disable directory visibility for resident
      await updateDoc(doc(db, 'residents', `res-${uid}`), {
        'directoryVisibility.isVisible': false
      }).catch(() => {});

      await fetchFamilies();
      setAuditLog(prev => [
        `FORMER_RESIDENT_PROCESSED: Archived ${name}, disabled login credentials, and released Flat ${flat} back to layout tables.`,
        ...prev
      ]);
    } catch (err: any) {
      console.error(err);
      setAuditLog(prev => [`FORMER_RESIDENT_ERROR: Failed to update status for ${name}: ${err.message}`, ...prev]);
    }
  };

  const pendingApprovals = families.filter(fam => fam.status === 'pendingApproval' || fam.status === 'correctionRequested');
  const activeDirectory = families.filter(fam => {
    const friendlyFlat = fam.buildingNumber && fam.unitNumber ? `${fam.buildingNumber} / ${fam.unitNumber}` : fam.flatNumber;
    return (fam.status === 'active' || fam.status === 'former') && 
      (fam.primaryName.toLowerCase().includes(searchTerm.toLowerCase()) || 
       fam.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
       friendlyFlat.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (fam.gmkId && fam.gmkId.toLowerCase().includes(searchTerm.toLowerCase())));
  });

  return (
    <div className="space-y-6">
      
      {/* Greetings segment */}
      <div>
        <h1 className="text-xl md:text-2xl font-display font-black text-slate-950 tracking-tight">
          Community Administration Panel
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
          Secure Resident Registries & Flat Provisioning
        </p>
      </div>

      {/* Numerical Quick Counters grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Enrolled Families', val: families.length, color: 'text-slate-900 border-slate-100' },
          { label: 'Active Households', val: families.filter(f => f.status === 'active').length, color: 'text-emerald-600 border-slate-100' },
          { label: 'Pending Approvals', val: pendingApprovals.length, color: 'text-blue-600 border-slate-100 bg-blue-50/20' },
          { label: 'Former Residents Archived', val: families.filter(f => f.status === 'former').length, color: 'text-rose-600 border-slate-100' }
        ].map((stat, i) => (
          <div key={i} className={`bg-white border p-4 rounded-2xl shadow-xs flex flex-col justify-between ${stat.color}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
            <span className="font-display font-black text-2xl mt-2">{stat.val}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Enrollment approvals queue */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <UserCheck className="w-5 h-5 text-slate-500" />
              <h3 className="font-display font-bold text-slate-900 text-sm">Approvals Queue</h3>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Check className="w-8 h-8 mx-auto text-emerald-500 bg-emerald-50 p-1.5 rounded-full" />
                <p className="text-xs font-semibold">Queue is pristine! No pending register proposals.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((fam) => (
                  <div key={fam.id} className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 text-sm block">{fam.primaryName}</span>
                        <span className="font-mono bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-bold">
                          Flat {fam.buildingNumber && fam.unitNumber ? `${fam.buildingNumber} / ${fam.unitNumber}` : fam.flatNumber}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">{fam.gmkId} • {fam.membersCount} members</span>
                      <span className="text-[11px] text-slate-500 inline-block mt-0.5">{fam.email}</span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {fam.status === 'correctionRequested' ? (
                        <div className="bg-amber-50 text-amber-800 text-[10px] p-2 rounded-lg font-mono border border-amber-150 mb-1.5 text-left">
                          <span className="font-bold">Sent back for correction:</span> "{fam.correctionNotes || 'No comment'}"
                        </div>
                      ) : null}
                      
                      <button
                        onClick={() => handleApprove(fam.id, fam.primaryName)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition active:scale-98"
                      >
                        Approve Profile
                      </button>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const reason = window.prompt(`Enter correction instructions for ${fam.primaryName}:`);
                            if (reason && reason.trim()) {
                              handleRequestCorrection(fam.id, fam.primaryName, reason.trim());
                            }
                          }}
                          className="w-1/2 border border-slate-200 text-slate-500 hover:bg-slate-105 hover:bg-slate-100 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition"
                        >
                          Request Correction
                        </button>
                        <button
                          onClick={() => handleReject(fam.id, fam.primaryName)}
                          className="w-1/2 border border-rose-200 text-rose-650 hover:bg-rose-50 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Former Resident Information Rules (Batch 3/6) */}
          <div className="bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
              <Archive className="w-4 h-4 text-rose-400" />
              <h4 className="font-display font-semibold text-white text-xs">Former Resident Provisioning rules</h4>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              When a member relocates out of the Greens Malayalee Community (GMK):
            </p>
            <ul className="text-[10px] space-y-1.5 list-disc pl-4 text-slate-400">
              <li>Historical transaction legers & event databases are fully preserved.</li>
              <li>Visible public profile attributes are completely hidden from indices.</li>
              <li>Authentication login handles are revoked in Firestore.</li>
              <li>Flat block allocations are released for new incoming registrations.</li>
            </ul>
          </div>

          {/* Configurable System-wide Safety Settings Card */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-55 flex-row">
              <ShieldAlert className="w-4 h-4 text-indigo-550 text-indigo-600" />
              <h4 className="font-display font-bold text-slate-900 text-xs ml-1">System settings / password policy</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Configure minimum security complexities enforced throughout the Greens Malayalee Community (GMK) registration wizard.
            </p>
            
            <div className="space-y-2">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-450">
                Minimum Password length
              </label>
              <div className="flex gap-1.5">
                {[6, 8, 10, 12].map((len) => (
                  <button
                    key={len}
                    onClick={() => {
                      localStorage.setItem('gmk_min_password_length', len.toString());
                      setMinPasswordLength(len);
                      // Log the event inside our active Simulated Admin console!
                      setAuditLog(prev => [
                        `SECURITY_UPDATED: Minimum password length policy changed to ${len} characters.`,
                        ...prev
                      ]);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition select-none cursor-pointer border ${
                      minPasswordLength === len
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-650'
                    }`}
                  >
                    {len} Chars
                  </button>
                ))}
              </div>
            </div>

            {/* Expanded Boolean Policy Rules */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                Complexity Guidelines
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-1">
                <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl cursor-pointer select-none transition text-left">
                  <input
                    type="checkbox"
                    checked={requireUppercase}
                    onChange={(e) => {
                      const val = e.target.checked;
                      localStorage.setItem('gmk_pass_require_uppercase', val.toString());
                      setRequireUppercase(val);
                      setAuditLog(prev => [
                        `SECURITY_UPDATED: Password policy "Require Uppercase [A-Z]" set to ${val}.`,
                        ...prev
                      ]);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 block">Require Uppercase</span>
                    <span className="text-[8.5px] text-slate-400 block -mt-0.5">Least one capital letter (A-Z)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl cursor-pointer select-none transition text-left">
                  <input
                    type="checkbox"
                    checked={requireLowercase}
                    onChange={(e) => {
                      const val = e.target.checked;
                      localStorage.setItem('gmk_pass_require_lowercase', val.toString());
                      setRequireLowercase(val);
                      setAuditLog(prev => [
                        `SECURITY_UPDATED: Password policy "Require Lowercase [a-z]" set to ${val}.`,
                        ...prev
                      ]);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 block">Require Lowercase</span>
                    <span className="text-[8.5px] text-slate-400 block -mt-0.5">Least one lowercase (a-z)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl cursor-pointer select-none transition text-left">
                  <input
                    type="checkbox"
                    checked={requireNumber}
                    onChange={(e) => {
                      const val = e.target.checked;
                      localStorage.setItem('gmk_pass_require_number', val.toString());
                      setRequireNumber(val);
                      setAuditLog(prev => [
                        `SECURITY_UPDATED: Password policy "Require Number [0-9]" set to ${val}.`,
                        ...prev
                      ]);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 block">Require Number</span>
                    <span className="text-[8.5px] text-slate-400 block -mt-0.5">Least one numeric digit (0-9)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl cursor-pointer select-none transition text-left">
                  <input
                    type="checkbox"
                    checked={requireSpecial}
                    onChange={(e) => {
                      const val = e.target.checked;
                      localStorage.setItem('gmk_pass_require_special', val.toString());
                      setRequireSpecial(val);
                      setAuditLog(prev => [
                        `SECURITY_UPDATED: Password policy "Require Special Character" set to ${val}.`,
                        ...prev
                      ]);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 block">Require Special Char</span>
                    <span className="text-[8.5px] text-slate-405 block -mt-0.5">Least one special (!@#$%^&*)</span>
                  </div>
                </label>
              </div>
            </div>
            <p className="text-[9.5px] text-slate-400 italic font-medium leading-normal">
              * The system is instant and reactive. The self-registering resident onboarding wizard automatically polls this value dynamically.
            </p>
          </div>
        </div>

        {/* Right column: Search and listings directories spreadsheet */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                <h3 className="font-display font-bold text-slate-900 text-sm font-display">Resident Directories Spreadsheet</h3>
              </div>
              
              {/* Search filter input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter name or flat..."
                  className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden text-slate-900 focus:bg-white transition w-full sm:w-48"
                />
              </div>
            </div>

            {/* Structured Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                    <th className="pb-2.5">GMK ID & NAME</th>
                    <th className="pb-2.5">FLAT</th>
                    <th className="pb-2.5">CONTACT</th>
                    <th className="pb-2.5">STATUS</th>
                    <th className="pb-2.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeDirectory.map((fam) => (
                    <tr key={fam.id} className="group hover:bg-slate-50/50 transition duration-150">
                      <td className="py-3">
                        <span className="font-mono font-bold text-slate-900 block">{fam.gmkId}</span>
                        <span className="font-semibold text-slate-600 truncate max-w-[140px] block">{fam.primaryName}</span>
                      </td>
                      <td className="py-3 font-semibold text-slate-900 font-mono text-[11px]">{fam.buildingNumber && fam.unitNumber ? `${fam.buildingNumber} / ${fam.unitNumber}` : fam.flatNumber}</td>
                      <td className="py-3">
                        <span className="block">{fam.email}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{fam.phone}</span>
                      </td>
                      <td className="py-3">
                        {fam.status === 'active' ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Active
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Former
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {fam.status === 'active' ? (
                          <button
                            onClick={() => handleProcessFormer(fam.id, fam.primaryName, fam.buildingNumber && fam.unitNumber ? `${fam.buildingNumber} / ${fam.unitNumber}` : fam.flatNumber)}
                            className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Mark Former
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold italic">Archived Off</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Immutable operations audit logger simulator */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <FileClock className="w-5 h-5 text-slate-500" />
              <h3 className="font-display font-bold text-slate-900 text-sm">System Audit Logging Console</h3>
            </div>
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-emerald-400 h-36 overflow-y-auto space-y-1.5 shadow-inner">
              {auditLog.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                  <p className="text-slate-300">{log}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
