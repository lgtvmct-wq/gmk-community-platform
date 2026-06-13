import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, AreaChart, MapPin, CheckCircle2, TrendingUp, Calendar, 
  Coins, Landmark, AlertCircle, FileClock 
} from 'lucide-react';

export default function PresidentDashboard() {
  const { isDemo } = useAuth();
  
  // Real overview variables supporting oversight checks
  const [totals] = useState({
    enrolledResidents: 1420,
    registeredFamilies: 124,
    currentCollectionOman: 3240.000, // OMR
    runningExpenses: 840.000, // OMR
    committedSponsorships: 1800.000 // OMR
  });

  const activeEvents = [
    { name: 'Onam Annual Feast 2026', director: 'Sajeev Nair', status: 'Registration Open', attendees: 240, target: 500, collections: 1200 },
    { name: 'GMAD Grand Assembly Muscat', director: 'Anish Kumar', status: 'Inactive / Preparing', attendees: 0, target: 400, collections: 0 }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Greetings Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-display font-black text-slate-950 tracking-tight">
          Executive Oversight Console
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
          President & Vice President Read-Only Community Scoping
        </p>
      </div>

      {/* Metrics board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Oman Residents', val: `${totals.enrolledResidents} Members`, desc: 'Across al hail greens', icon: Users, color: 'text-indigo-600' },
          { label: 'Event Collections', val: `${totals.currentCollectionOman.toFixed(3)} OMR`, desc: 'Direct financial income', icon: Landmark, color: 'text-emerald-600 font-mono' },
          { label: 'Running Expenses', val: `${totals.runningExpenses.toFixed(3)} OMR`, desc: 'Approved items payed', icon: Coins, color: 'text-rose-600 font-mono' },
          { label: 'Sponsor Pledges', val: `${totals.committedSponsorships.toFixed(3)} OMR`, desc: 'Committed commercial sponsors', icon: TrendingUp, color: 'text-orange-600 font-mono' }
        ].map((met, i) => (
          <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-start gap-3.5">
            <div className="p-2 bg-slate-50 border border-slate-100/80 rounded-xl text-slate-500">
              <met.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{met.label}</span>
              <span className={`font-display font-black text-lg block mt-1 ${met.color}`}>{met.val}</span>
              <span className="text-[9px] text-slate-400 font-medium capitalize block mt-0.5">{met.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left columns: Read-Only Events Operations Lists */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Calendar className="w-5 h-5 text-slate-500" />
              <h3 className="font-display font-bold text-slate-900 text-sm">Community Live Events Status</h3>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Read-only operations track of upcoming calendar events. Custom actions or status shifting are restricted to Event Directors and admins.
            </p>

            <div className="space-y-4">
              {activeEvents.map((evt, id) => (
                <div key={id} className="border border-slate-100/80 rounded-2xl p-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:bg-slate-50">
                  <div className="space-y-1">
                    <header className="flex items-center gap-2">
                      <span className="bg-blue-50 text-blue-800 border border-blue-100 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                        {evt.status}
                      </span>
                    </header>
                    <h4 className="font-display font-black text-slate-950 text-sm mt-1">{evt.name}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Operational Director: {evt.director}</span>
                  </div>

                  {/* Meter reading stats for oversight */}
                  <div className="flex gap-4 text-xs">
                    <div className="bg-white px-3 py-2 rounded-xl border border-slate-100 text-center min-w-[100px]">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Attendees</span>
                      <strong className="font-mono font-bold text-slate-900 mt-0.5 block">{evt.attendees}/{evt.target}</strong>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-xl border border-slate-100 text-center min-w-[100px]">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Collections</span>
                      <strong className="font-mono font-bold text-emerald-600 mt-0.5 block">{evt.collections.toFixed(3)} OMR</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: President instructions disclaimer */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3 text-slate-900">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-display font-bold text-sm">President Review Duties</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Under our community constitution rules:
            </p>
            <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4">
              <li>President and VP have community-wide read-only access. This ensures perfect operational oversight and complete administrative safety without interfering in daily registrations processing.</li>
              <li>Please request Event Directors or Administrative folks directly for modifications on event pricing constants or resident profiles configurations.</li>
            </ul>
          </div>

          <div className="bg-indigo-900 text-indigo-100 border border-indigo-800 rounded-2xl p-5 shadow-sm space-y-3">
            <header className="flex items-center gap-2 pb-2.5 border-b border-indigo-800">
              <AlertCircle className="w-4 h-4 text-emerald-400" />
              <h4 className="font-display font-semibold text-white text-xs">OOMR Audit Safeguard</h4>
            </header>
            <p className="text-[10px] text-indigo-200 leading-normal">
              Any financial transactions or sponsorships verified by the finance team generates automatic secure logs visible inside the immutable auditing logger streams.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
