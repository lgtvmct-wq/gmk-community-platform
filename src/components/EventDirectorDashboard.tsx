import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, Award, Heart, Check, Settings, CircleHelp, Info, 
  Coins, UserRound, ArrowRight, Save, LayoutGrid 
} from 'lucide-react';

export default function EventDirectorDashboard() {
  const { isDemo } = useAuth();
  
  // Simulated State for the current assigned event configuration (conforms with Batch 3/6)
  const [eventName, setEventName] = useState('Onam Utsav Annual Feast 2026');
  const [status, setStatus] = useState<'draft' | 'inactive' | 'active' | 'registrationOpen' | 'registrationClosed' | 'completed' | 'archived'>('active');
  const [maxCapacity, setMaxCapacity] = useState(600);
  
  // Pricing Rules State
  const [singleRate, setSingleRate] = useState(5.000); // 5 OMR
  const [coupleRate, setCoupleRate] = useState(9.000); // 9 OMR
  const [familyRate, setFamilyRate] = useState(15.000); // 15 OMR
  const [guestRate, setGuestRate] = useState(7.000); // 7 OMR
  
  // Child Pricing Brackets configured by Event Director (Section 4 rules)
  const [freeChildAgeLimit, setFreeChildAgeLimit] = useState(5);
  const [partialChildMinAge, setPartialChildMinAge] = useState(6);
  const [partialChildMaxAge, setPartialChildMaxAge] = useState(12);
  const [partialChildChargeType, setPartialChildChargeType] = useState<'percentage' | 'fixed'>('fixed');
  const [partialChildChargeValue, setPartialChildChargeValue] = useState(3.000); // e.g. 3 OMR or 50%
  const [familyQualifyingAge, setFamilyQualifyingAge] = useState(13); // Age at which child qualifies for family rate evaluation
  
  const [savedSuccess, setSavedSuccess] = useState(false);

  const statuses: ('draft' | 'inactive' | 'active' | 'registrationOpen' | 'registrationClosed' | 'completed' | 'archived')[] = 
    ['draft', 'inactive', 'active', 'registrationOpen', 'registrationClosed', 'completed', 'archived'];

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    inactive: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    active: 'bg-blue-50 text-blue-700 border-blue-200',
    registrationOpen: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    registrationClosed: 'bg-rose-50 text-rose-700 border-rose-200',
    completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    archived: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  const handleSaveConfig = (e: FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Greetings Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-display font-black text-slate-950 tracking-tight">
          Event Governance & Operations Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
          Operational Command Console for Assigned Events Only
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Event details & active status controller */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Calendar className="w-5 h-5 text-slate-500" />
              <h3 className="font-display font-bold text-slate-900 text-sm">Assigned Event Details</h3>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Maximum Headcount Capacity
                </label>
                <input
                  type="number"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Active Lifecycle Status
                </label>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`w-full flex justify-between items-center text-left text-xs px-3 py-2 rounded-xl border transition ${
                        status === s
                          ? 'bg-slate-950 text-white border-slate-950 font-bold'
                          : 'hover:bg-slate-50 text-slate-600 border-slate-100'
                      }`}
                    >
                      <span className="capitalize">{s.replace(/([A-Z])/g, ' $1')}</span>
                      {status === s && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Summary Rules Sheet */}
          <div className="bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
              <Coins className="w-4 h-4 text-emerald-400" />
              <h4 className="font-display font-semibold text-white text-xs">Pricing Architecture Guidelines</h4>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Our automated Community-Centric pricing calculations behave as follows:
            </p>
            <ul className="text-[10px] space-y-1.5 list-disc pl-4 text-slate-400">
              <li><strong>Family Categorization:</strong> Derived auto-categorization evaluated on registered adults and qualifying child age limits.</li>
              <li><strong>Parent Inclusions:</strong> Living-in parental folks are never charged separate fees and are mapped directly into the family bundle.</li>
              <li><strong>Continuous Ranges:</strong> Child age brackets are continuous and non-overlapping. No isolated gaps exist.</li>
              <li><strong>Partial Charges:</strong> Evaluated once per household unit to support the community, not multiplied by kid count.</li>
            </ul>
          </div>
        </div>

        {/* Right column: Configurator forms */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSaveConfig} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-500" />
                <h3 className="font-display font-bold text-slate-900 text-sm">Event Pricing & Category Configurator</h3>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save Constants
              </button>
            </div>

            {savedSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold p-3 rounded-xl block text-center animate-in fade-in duration-150">
                ✓ Event Governance constants saved successfully to databases!
              </div>
            )}

            {/* General rates section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-slate-400" /> Base Event Fees (OMR)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Single Rate', val: singleRate, set: setSingleRate },
                  { label: 'Couple Rate', val: coupleRate, set: setCoupleRate },
                  { label: 'Family Rate', val: familyRate, set: setFamilyRate },
                  { label: 'Guest Rate', val: guestRate, set: setGuestRate }
                ].map((rate, idx) => (
                  <div key={idx} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{rate.label}</label>
                    <input
                      type="number"
                      step="0.001"
                      value={rate.val}
                      onChange={(e) => rate.set(Number(e.target.value))}
                      className="w-full bg-transparent border-0 font-mono font-bold text-slate-950 text-sm focus:outline-hidden p-0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Child categories brackets configurator */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-slate-400" /> Child Age Brackets
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Free Bracket */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <header className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Free Child Bracket</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded uppercase">0.000 OMR</span>
                  </header>
                  <p className="text-[10px] text-slate-400">
                    Children below or equal to this limit are fully free of charge inside the portal registration.
                  </p>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Max Age for Free Tier</label>
                    <input
                      type="number"
                      value={freeChildAgeLimit}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFreeChildAgeLimit(val);
                        setPartialChildMinAge(val + 1);
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Partial Child bracket */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <header className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Partial Child Bracket</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 rounded uppercase">Single partial fee</span>
                  </header>
                  <p className="text-[10px] text-slate-400">
                    Children inside this zone generate a single charge per household, avoiding compounding child costs.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Min Age</label>
                      <input
                        type="number"
                        disabled
                        value={partialChildMinAge}
                        className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Max Age</label>
                      <input
                        type="number"
                        value={partialChildMaxAge}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPartialChildMaxAge(val);
                          setFamilyQualifyingAge(val + 1);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Partial fee calculation options */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-4 text-xs">
                <header className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Info className="w-4 h-4 text-slate-400" />
                  Calculation Mechanics for Partial Child Fee
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Calculation Type</label>
                    <select
                      value={partialChildChargeType}
                      onChange={(e) => setPartialChildChargeType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="fixed">Fixed OMR Amount</option>
                      <option value="percentage">Percentage of Single Rate (%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">
                      {partialChildChargeType === 'fixed' ? 'Fixed OMR Amount' : 'Percentage (e.g. 50)'}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={partialChildChargeValue}
                      onChange={(e) => setPartialChildChargeValue(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 bg-indigo-50 border border-indigo-100 text-indigo-950 p-3 rounded-lg text-[10px] leading-relaxed">
                  <span className="font-bold">Calculated Rate:</span>
                  <div>
                    {partialChildChargeType === 'fixed' 
                      ? `Each household registration containing children between ${partialChildMinAge} and ${partialChildMaxAge} adds flat ${partialChildChargeValue.toFixed(3)} OMR.` 
                      : `Each household registration with children between ${partialChildMinAge} and ${partialChildMaxAge} adds ${partialChildChargeValue}% of Single Rate (${(singleRate * partialChildChargeValue / 100).toFixed(3)} OMR).`
                    }
                  </div>
                </div>
              </div>

              {/* Family Qualification Category */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3 text-xs">
                <header className="font-bold text-slate-900">
                  Family Qualification Age limit
                </header>
                <p className="text-[10px] text-slate-400">
                  A child reaching or exceeding this configured limit qualifies as a full-rate adult, automatically evaluating pricing as Couple/Family based on the composition.
                </p>
                <div className="max-w-xs">
                  <label className="block text-[10px] text-slate-500 mb-1">Qualification Age Limit</label>
                  <input
                    type="number"
                    disabled
                    value={familyQualifyingAge}
                    className="w-full px-3 py-1.5 bg-slate-150 border border-slate-200 rounded-lg text-xs font-semibold text-slate-400"
                  />
                </div>
              </div>

            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
