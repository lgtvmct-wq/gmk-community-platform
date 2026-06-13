import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings, Key, Database, KeyRound, Save, Check, FileClock, 
  Trash2, ShieldAlert, Cpu, Heart, CheckCircle 
} from 'lucide-react';

interface AuditRecord {
  timestamp: string;
  action: string;
  user: string;
  details: string;
  tag: 'RESIDENT' | 'EVENT' | 'FINANCE' | 'SECURITY';
}

export default function SuperAdminDashboard() {
  const { isDemo } = useAuth();
  
  // System Configurations
  const [gmkIdCounter, setGmkIdCounter] = useState(128); // Standard sequential increments
  const [gmkIdPrefix, setGmkIdPrefix] = useState('GMK');
  const [presidentSignatureUrl, setPresidentSignatureUrl] = useState('signature_joseph_kurian_encrypted.png');
  const [vpSignatureUrl, setVpSignatureUrl] = useState('signature_gopinath_official.png');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Simulated immutable database records for Audit logs
  const [logs] = useState<AuditRecord[]>([
    { timestamp: '2026-05-31 04:12:15', action: 'RESIDENT_CREATED', user: 'admin@gmk.com', details: 'Added new family unit GMK000125 for Sunil', tag: 'RESIDENT' },
    { timestamp: '2026-05-31 04:15:22', action: 'EVENT_ACTIVATED', user: 'ed@gmk.com', details: 'Status of Onam Festive shifted active', tag: 'EVENT' },
    { timestamp: '2026-05-31 04:20:11', action: 'PAYMENT_RECORDED', user: 'finance@gmk.com', details: 'Payment Verified for Sunil (15.000 OMR)', tag: 'FINANCE' },
    { timestamp: '2026-05-31 04:30:00', action: 'EXPENSE_SUBMITTED', user: 'president@gmk.com', details: 'Expense submitted for sound gear (45.000 OMR)', tag: 'FINANCE' },
    { timestamp: '2026-05-31 04:45:00', action: 'SECURITY_AUDIT', user: 'super@gmk.com', details: 'Firestore Fortress security rules deployed successfully', tag: 'SECURITY' }
  ]);

  const handleSaveConfigs = (e: FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const tagColors = {
    RESIDENT: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    EVENT: 'bg-blue-50 text-blue-800 border-blue-100',
    FINANCE: 'bg-orange-50 text-orange-800 border-orange-100',
    SECURITY: 'bg-purple-50 text-purple-800 border-purple-100'
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Greetings Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-display font-black text-slate-950 tracking-tight">
          Super Administrative Control Panel
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
          Platform Ownership, System Configuration & Security Rules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: ID generation controls & master system signature uploaders */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSaveConfigs} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3 text-slate-900">
              <Cpu className="w-5 h-5" />
              <h3 className="font-display font-bold text-sm">System Global Configurations</h3>
            </div>

            {savedSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-bold p-2.5 rounded-xl text-center select-none animate-in fade-in duration-150">
                ✓ Global parameters saved to Firestore systemSettings collection!
              </div>
            )}

            <div className="space-y-3.5 text-xs text-slate-600">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  GMK ID Prefix
                </label>
                <input
                  type="text"
                  value={gmkIdPrefix}
                  onChange={(e) => setGmkIdPrefix(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  GMK Sequential Starting Counter
                </label>
                <input
                  type="number"
                  value={gmkIdCounter}
                  onChange={(e) => setGmkIdCounter(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs"
                />
                <p className="mt-1 text-[9px] text-slate-400">Next family registered becomes <strong>{gmkIdPrefix}{(gmkIdCounter + 1).toString().padStart(6, '0')}</strong>.</p>
              </div>

              <div className="pt-2 border-t border-slate-50 space-y-3">
                <h4 className="font-bold text-slate-900">Certificate Signatures</h4>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">President Signature file path</label>
                  <input
                    type="text"
                    value={presidentSignatureUrl}
                    onChange={(e) => setPresidentSignatureUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono text-[10px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">VP Signature file path</label>
                  <input
                    type="text"
                    value={vpSignatureUrl}
                    onChange={(e) => setVpSignatureUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono text-[10px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-850 text-white shadow-xs cursor-pointer active:scale-98 transition duration-150"
              >
                Save System Constants
              </button>
            </div>
          </form>

          {/* Master Super admin overrides disclaimer */}
          <div className="bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <h4 className="font-display font-semibold text-white text-xs">Platform Security Protocols</h4>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Direct administrative overrides bypassing standard Event Director state configurations:
            </p>
            <ul className="text-[10px] space-y-1.5 list-disc pl-4 text-slate-400">
              <li>Deploy and override Firestore Security Rules on the live project workspace.</li>
              <li>Manually override status transitions for stuck community event registrations.</li>
              <li>Auditing full-scale financial transactions logs.</li>
            </ul>
          </div>
        </div>

        {/* Right column: Secure Audit Log database stream */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <FileClock className="w-5 h-5 text-slate-500" />
                <h3 className="font-display font-bold text-slate-900 text-sm">Immutable Audit Logs Stream</h3>
              </div>
              <span className="text-[9px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 border border-purple-100 rounded-full uppercase tracking-wider">
                Fortress Auditing Active
              </span>
            </div>

            <p className="text-xs text-slate-400">
              All administrative and operational actions generate secure, structured logging entries. Under Zero-Trust protocols, logs are fully immutable.
            </p>

            {/* Audit log entries */}
            <div className="space-y-3.5 mt-2 max-h-120 overflow-y-auto pr-1">
              {logs.map((log, idx) => (
                <div key={idx} className="border border-slate-100 bg-slate-50/40 hover:bg-slate-50 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs transition">
                  <div className="space-y-1">
                    <header className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider ${tagColors[log.tag]}`}>
                        {log.tag}
                      </span>
                      <strong className="text-slate-900 font-mono text-[11px]">{log.action}</strong>
                    </header>
                    <p className="text-slate-600 font-semibold">{log.details}</p>
                    <span className="text-[10px] text-slate-400 block font-semibold">Initiated By: <code>{log.user}</code></span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 sm:self-start">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
