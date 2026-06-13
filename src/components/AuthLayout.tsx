import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Shield, Building, KeyRound, AlertTriangle, Key, HelpCircle, CheckCircle, Eye, EyeOff, Plus, Trash2, ArrowRight, ArrowLeft, Check, Lock, User, Users, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';
import { createUserWithEmailAndPassword, sendEmailVerification, updatePassword } from 'firebase/auth';
import { doc, setDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

// Visual Refinement Assets
import loginBg from '../assets/images/login_background.png';
import gmkLogo from '../assets/images/logo_1780209487418.png';

export default function AuthLayout() {
  const { 
    loginWithEmail, 
    loginWithGoogle, 
    resetPassword,
    error, 
    setError,
    loading
  } = useAuth();
  
  // Input fields state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot password flow state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  // Registration Wizard states
  const [showRegModal, setShowRegModal] = useState(false);
  const [regStep, setRegStep] = useState<number>(1);
  const [regBuildingNumber, setRegBuildingNumber] = useState('');
  const [regUnitNumber, setRegUnitNumber] = useState('');
  const [regFlatNumber, setRegFlatNumber] = useState('');
  const [regPrimaryName, setRegPrimaryName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  
  // Custom configurable password policy syncing state
  const [minPasswordLength, setMinPasswordLength] = useState<number>(8);
  const [reqUppercase, setReqUppercase] = useState<boolean>(false);
  const [reqLowercase, setReqLowercase] = useState<boolean>(false);
  const [reqNumber, setReqNumber] = useState<boolean>(false);
  const [reqSpecial, setReqSpecial] = useState<boolean>(false);
  
  // Password setup fields
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // Profile Completion fields
  const [regPrimaryTitle, setRegPrimaryTitle] = useState('Mr.');
  const [regPrimaryGender, setRegPrimaryGender] = useState<'Male' | 'Female'>('Male');
  const [regPrimaryProfession, setRegPrimaryProfession] = useState('');
  const [regPrimaryCompany, setRegPrimaryCompany] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWhatsApp, setRegWhatsApp] = useState('');
  const [regCountry] = useState('Oman');

  // Phone / WhatsApp detailed state variables with country selector
  const [regPhoneCountry, setRegPhoneCountry] = useState('+968');
  const [regPhoneDigits, setRegPhoneDigits] = useState('');
  const [isWhatsAppSame, setIsWhatsAppSame] = useState(true);
  const [regWhatsAppCountry, setRegWhatsAppCountry] = useState('+968');
  const [regWhatsAppDigits, setRegWhatsAppDigits] = useState('');

  // Sync regPhone and regWhatsApp back to keep compatibility perfectly intact
  useEffect(() => {
    const formattedPhone = `${regPhoneCountry} ${regPhoneDigits.trim()}`;
    setRegPhone(formattedPhone);
  }, [regPhoneCountry, regPhoneDigits]);

  useEffect(() => {
    if (isWhatsAppSame) {
      const formattedPhone = `${regPhoneCountry} ${regPhoneDigits.trim()}`;
      setRegWhatsApp(formattedPhone);
    } else {
      const formattedWhatsApp = `${regWhatsAppCountry} ${regWhatsAppDigits.trim()}`;
      setRegWhatsApp(formattedWhatsApp);
    }
  }, [isWhatsAppSame, regPhoneCountry, regPhoneDigits, regWhatsAppCountry, regWhatsAppDigits]);

  // Step 5: Household Member states
  interface AdditionalMember {
    name: string;
    relationship: 'Spouse' | 'Parent' | 'Child' | 'Other';
    gender: 'Male' | 'Female';
    yearOfBirth?: string;
  }
  const [additionalMembers, setAdditionalMembers] = useState<AdditionalMember[]>([]);
  const [newMemName, setNewMemName] = useState('');
  const [newMemRelationship, setNewMemRelationship] = useState<string>('');
  const [newMemGender, setNewMemGender] = useState<string>('');
  const [newMemYearOfBirth, setNewMemYearOfBirth] = useState('');
  const [newMemTitle, setNewMemTitle] = useState('Mr.');
  const [showAddForm, setShowAddForm] = useState(false);

  // Step 6: Privacy preferences states
  const [prefIsVisible, setPrefIsVisible] = useState(true);
  const [prefShowPhone, setPrefShowPhone] = useState(true);
  const [prefShowProfession, setPrefShowProfession] = useState(true);
  const [prefShowCompanyName, setPrefShowCompanyName] = useState(true);
  
  // Wizard Local validation messages
  const [wizardError, setWizardError] = useState('');
  const [wizardSuccess, setWizardSuccess] = useState('');
  const [wizardLoading, setWizardLoading] = useState(false);

  // Sync password policy with Admin Dashboard settings upon opening modal
  useEffect(() => {
    if (showRegModal) {
      const val = localStorage.getItem('gmk_min_password_length');
      if (val) {
        setMinPasswordLength(parseInt(val, 10));
      }
      setReqUppercase(localStorage.getItem('gmk_pass_require_uppercase') === 'true');
      setReqLowercase(localStorage.getItem('gmk_pass_require_lowercase') === 'true');
      setReqNumber(localStorage.getItem('gmk_pass_require_number') === 'true');
      setReqSpecial(localStorage.getItem('gmk_pass_require_special') === 'true');
    }
  }, [showRegModal]);

  // Load remember me email if any
  useEffect(() => {
    const saved = localStorage.getItem('gmk_remembered_identifier');
    if (saved) {
      setLoginIdentifier(saved);
      setRememberMe(true);
    }
  }, []);

  // Sentence-case converter helper for name fields (Title Case)
  const formatSentenceCase = (name: string) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Add member helper
  const handleAddMember = () => {
    if (!newMemName.trim()) {
      setWizardError('Please enter family member Name.');
      return;
    }
    if (!newMemRelationship) {
      setWizardError('Please select member Relationship.');
      return;
    }
    if (!newMemGender) {
      setWizardError('Please select member Gender.');
      return;
    }
    
    // Check if child is selected and year of birth is missing or invalid
    if (newMemRelationship === 'Child') {
      if (!newMemYearOfBirth.trim()) {
        setWizardError('Please enter the year of birth for the child.');
        return;
      }
      const yob = parseInt(newMemYearOfBirth, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(yob) || yob < 1900 || yob > currentYear) {
        setWizardError(`Please enter a valid 4-digit year of birth (between 1900 and ${currentYear}).`);
        return;
      }
    }

    setWizardError('');
    // Prefix name with title selection
    const prefixedName = `${newMemTitle} ${formatSentenceCase(newMemName.trim())}`;
    setAdditionalMembers(prev => [...prev, {
      name: prefixedName,
      relationship: newMemRelationship as any,
      gender: newMemGender as any,
      yearOfBirth: newMemRelationship === 'Child' ? newMemYearOfBirth.trim() : undefined
    }]);

    // Reset fields & close add form
    setNewMemName('');
    setNewMemRelationship('');
    setNewMemGender('');
    setNewMemTitle('Mr.');
    setNewMemYearOfBirth('');
    setShowAddForm(false);
  };

  // Remove member helper
  const handleRemoveMember = (index: number) => {
    setAdditionalMembers(prev => prev.filter((_, idx) => idx !== index));
  };

  // Pinned countries list (Oman & India are pinned)
  const countryList = [
    'Oman',
    'India',
    'Bahrain',
    'Canada',
    'Egypt',
    'Kuwait',
    'Pakistan',
    'Qatar',
    'Saudi Arabia',
    'United Arab Emirates',
    'United Kingdom',
    'United States'
  ];

  // Password Strength Evaluator matching configurable system policy
  const evaluatePasswordStrength = (pass: string) => {
    if (!pass) return { label: 'None', score: 0, color: 'bg-slate-100 text-slate-400 border-transparent', pct: 0 };
    if (pass.length < minPasswordLength) {
      return { 
        label: `Under ${minPasswordLength} Chars Policy`, 
        score: 1, 
        color: 'bg-rose-500 text-rose-700 border-rose-200',
        pct: 25
      };
    }
    let criteria = 0;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) criteria++;
    if (/[0-9]/.test(pass)) criteria++;
    if (/[^A-Za-z0-9]/.test(pass)) criteria++;
    
    if (criteria <= 1) {
      return { label: 'Medium Security', score: 2, color: 'bg-amber-500 text-amber-700 border-amber-250', pct: 50 };
    } else if (criteria === 2) {
      return { label: 'High Security', score: 3, color: 'bg-blue-500 text-blue-700 border-blue-250', pct: 75 };
    } else {
      return { label: 'Excellent Security', score: 4, color: 'bg-emerald-500 text-emerald-700 border-emerald-250', pct: 100 };
    }
  };

  // Validate step transitions
  const handleNextStep = async () => {
    setWizardError('');
    
    if (regStep === 1) {
      // Step 1: Initial Registration
      if (!regBuildingNumber.trim()) {
        setWizardError('Building Number is required (e.g. B3-04).');
        return;
      }
      if (!regUnitNumber.trim()) {
        setWizardError('Flat Number is required (e.g. 01).');
        return;
      }
      const bld = regBuildingNumber.trim();
      const unit = regUnitNumber.trim();
      const flat = (bld.replace(/[^A-Z0-9]/ig, '') + unit.replace(/[^A-Z0-9]/ig, '')).toUpperCase();
      const name = formatSentenceCase(regPrimaryName.trim());
      const email = regEmail.trim();

      if (!name) {
        setWizardError('Primary Adult Name is required.');
        return;
      }
      if (!email || !email.includes('@') || !email.includes('.')) {
        setWizardError('Please supply a valid Email address format (e.g., mail@gmk.com).');
        return;
      }

      // Update state formatted
      setRegFlatNumber(flat);
      setRegPrimaryName(name);
      setRegEmail(email);

      // Create a pending registration record simulation
      const mockPendingVerification = {
        buildingNumber: bld,
        unitNumber: unit,
        flatNumber: flat,
        primaryName: name,
        email: email,
        status: 'pendingVerification'
      };
      localStorage.setItem('gmk_temp_registration', JSON.stringify(mockPendingVerification));

      // PRODUCTION: Create actual Firebase Auth account with a temporary secure password
      setWizardLoading(true);
      try {
        const tempPass = "GmkTempPass!" + Math.floor(Math.random() * 10000000);
        const cred = await createUserWithEmailAndPassword(auth, email, tempPass);
        await sendEmailVerification(cred.user);
        setRegStep(2);
      } catch (err: any) {
        setWizardError(err.message || 'Firebase Auth account creation failed. Please check connection and try again.');
      } finally {
        setWizardLoading(false);
      }
      return;
    }
    
    if (regStep === 3) {
      // Step 3: Create Password
      if (!regPassword) {
        setWizardError('Please enter a secure password.');
        return;
      }
      if (regPassword.length < minPasswordLength) {
        setWizardError(`Password falls short of policy. Minimum configurable length is ${minPasswordLength} characters.`);
        return;
      }
      if (reqUppercase && !/[A-Z]/.test(regPassword)) {
        setWizardError('Password must contain at least one uppercase letter (A-Z).');
        return;
      }
      if (reqLowercase && !/[a-z]/.test(regPassword)) {
        setWizardError('Password must contain at least one lowercase letter (a-z).');
        return;
      }
      if (reqNumber && !/[0-9]/.test(regPassword)) {
        setWizardError('Password must contain at least one numeric digit (0-9).');
        return;
      }
      if (reqSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(regPassword)) {
        setWizardError('Password must contain at least one special character (e.g. !@#$%^&*).');
        return;
      }
      if (regPassword !== regConfirmPassword) {
        setWizardError('Entered passwords do not match.');
        return;
      }

      // PRODUCTION: Update the active Firebase password!
      setWizardLoading(true);
      try {
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, regPassword);
          setRegStep(4);
        } else {
          throw new Error('No active registration session found. Please restart onboarding from step 1.');
        }
      } catch (err: any) {
        setWizardError(err.message || 'Failed to update credentials inside Firebase. Please try again.');
      } finally {
        setWizardLoading(false);
      }
      return;
    }

    if (regStep === 4) {
      // Step 4: Primary Adult Profile Completion
      if (!regPhoneDigits.trim()) {
        setWizardError('Primary contact Phone Number is required.');
        return;
      }
      const sanitizedPhone = regPhoneDigits.replace(/\D/g, '');
      if (regPhoneCountry === '+968') {
        if (sanitizedPhone.length !== 8) {
          setWizardError('Oman phone number must be exactly 8 digits.');
          return;
        }
      } else if (regPhoneCountry === '+91') {
        if (sanitizedPhone.length !== 10) {
          setWizardError('India mobile number must be exactly 10 digits.');
          return;
        }
      } else {
        if (sanitizedPhone.length < 5 || sanitizedPhone.length > 15) {
          setWizardError('Please enter a valid international phone number (5 to 15 digits).');
          return;
        }
      }

      if (!isWhatsAppSame) {
        if (!regWhatsAppDigits.trim()) {
          setWizardError('WhatsApp Number is required since it is not the same as your Phone number.');
          return;
        }
        const sanitizedWhatsApp = regWhatsAppDigits.replace(/\D/g, '');
        if (regWhatsAppCountry === '+968') {
          if (sanitizedWhatsApp.length !== 8) {
            setWizardError('Oman WhatsApp number must be exactly 8 digits.');
            return;
          }
        } else if (regWhatsAppCountry === '+91') {
          if (sanitizedWhatsApp.length !== 10) {
            setWizardError('India WhatsApp number must be exactly 10 digits.');
            return;
          }
        } else {
          if (sanitizedWhatsApp.length < 5 || sanitizedWhatsApp.length > 15) {
            setWizardError('Please enter a valid international WhatsApp number (5 to 15 digits).');
            return;
          }
        }
      }

      // Condition: Profession & Company Name required if applicant is Male
      if (regPrimaryGender === 'Male') {
        if (!regPrimaryProfession.trim()) {
          setWizardError('Profession designation is required for the Male primary applicant.');
          return;
        }
        if (!regPrimaryCompany.trim()) {
          setWizardError('Company / organization name is required for the Male primary applicant.');
          return;
        }
      }
    }

    setRegStep(prev => prev + 1);
  };

  // Check if real Firebase link has been verified
  const handleCheckVerification = async () => {
    setWizardError('');
    setWizardSuccess('');
    setWizardLoading(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setWizardSuccess('Email successfully verified! Proceeding to credentials.');
          setRegStep(3);
        } else {
          setWizardError('Your email has not been verified yet. Check your spam and click the link inside the verification email.');
        }
      } else {
        setWizardError('No active verification session detected. Try starting over from Step 1.');
      }
    } catch (err: any) {
      setWizardError(err.message || 'Verification status check failed.');
    } finally {
      setWizardLoading(false);
    }
  };

  // Resend the real Firebase verification link
  const handleResendVerification = async () => {
    setWizardError('');
    setWizardSuccess('');
    setWizardLoading(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setWizardSuccess('A fresh email verification link has been successfully resent to your address.');
      } else {
        setWizardError('No logged in registration record was fetched.');
      }
    } catch (err: any) {
      setWizardError(err.message || 'Failure occurred resending email.');
    } finally {
      setWizardLoading(false);
    }
  };

  // Go back
  const handlePrevStep = () => {
    setWizardError('');
    if (regStep === 3) {
      // If we go back from Create Password, return to step 1
      setRegStep(1);
    } else {
      setRegStep(prev => prev - 1);
    }
  };

  // Reset entire flow state on abort or cancel
  const closeRegModal = () => {
    setShowRegModal(false);
    setRegStep(1);
    setRegFlatNumber('');
    setRegPrimaryName('');
    setRegPrimaryTitle('Mr.');
    setRegPrimaryProfession('');
    setRegPrimaryCompany('');
    setRegPhone('');
    setRegWhatsApp('');
    setRegPrimaryGender('Male');
    setAdditionalMembers([]);
    setNewMemName('');
    setNewMemRelationship('');
    setNewMemGender('');
    setNewMemTitle('Mr.');
    setShowAddForm(false);
    setPrefIsVisible(true);
    setPrefShowPhone(true);
    setPrefShowProfession(true);
    setPrefShowCompanyName(true);
    setRegPassword('');
    setRegConfirmPassword('');
    setWizardError('');
    setWizardSuccess('');
    localStorage.removeItem('gmk_temp_registration');
  };

  // Final submit handler after completing directory profiles
  const handleWizardSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWizardError('');
    setWizardSuccess('');
    setWizardLoading(true);

    try {
      const uid = auth.currentUser?.uid || `user-${Date.now()}`;
      const email = auth.currentUser?.email || regEmail.trim();
      const bldVal = regBuildingNumber.trim();
      const unitVal = regUnitNumber.trim();
      const flat = (bldVal.replace(/[^A-Z0-9]/ig, '') + unitVal.replace(/[^A-Z0-9]/ig, '')).toUpperCase();
      const primaryNameFormatted = `${regPrimaryTitle} ${regPrimaryName}`.trim();

      // Double check uniqueness of flat number across Active families
      const activeFamiliesQuery = query(
        collection(db, 'families'),
        where('flatNumber', '==', flat),
        where('status', '==', 'active')
      );
      const activeFamiliesSnap = await getDocs(activeFamiliesQuery);
      if (!activeFamiliesSnap.empty) {
        setWizardError('This Flat Number is already registered and occupied by an active household.');
        setWizardLoading(false);
        return;
      }

      const familyId = `fam-${uid}`;
      const residentId = `res-${uid}`;

      const formattedPhone = `${regPhoneCountry} ${regPhoneDigits.replace(/\D/g, '')}`.trim();
      const formattedWhatsApp = isWhatsAppSame 
        ? formattedPhone 
        : `${regWhatsAppCountry} ${regWhatsAppDigits.replace(/\D/g, '')}`.trim();

      const newFamilyRecord = {
        id: familyId,
        gmkId: '', // OMITTED: Generated only after Admin approval
        buildingNumber: bldVal,
        unitNumber: unitVal,
        flatNumber: flat,
        primaryName: primaryNameFormatted,
        status: 'pendingApproval' as const,
        email: email,
        phone: formattedPhone,
        whatsapp: formattedWhatsApp,
        gender: regPrimaryGender,
        profession: regPrimaryGender === 'Male' ? regPrimaryProfession.trim() : null,
        companyName: regPrimaryGender === 'Male' ? regPrimaryCompany.trim() : null,
        membersCount: 1 + additionalMembers.length,
        members: additionalMembers,
        createdAt: new Date().toISOString()
      };

      const newResidentRecord = {
        id: residentId,
        familyRef: familyId,
        buildingNumber: bldVal,
        unitNumber: unitVal,
        flatNumber: flat, // Added flatNumber to ResidentProfile for single-collection query visibility!!!
        fullName: primaryNameFormatted,
        gender: regPrimaryGender,
        email: email,
        phone: formattedPhone,
        whatsApp: formattedWhatsApp,
        profession: regPrimaryGender === 'Male' ? regPrimaryProfession.trim() : null,
        companyName: regPrimaryGender === 'Male' ? regPrimaryCompany.trim() : null,
        directoryVisibility: {
          isVisible: prefIsVisible,
          showPhoneNumber: prefShowPhone,
          showProfession: prefShowProfession,
          showCompanyName: prefShowCompanyName
        }
      };

      const newUserRecord = {
        uid: uid,
        email: email,
        roles: ['resident'],
        residentRef: residentId,
        isActive: false, // INACTIVE: Must be activated by Admin upon approval!
        createdAt: new Date().toISOString()
      };

      // Write to families collection
      await setDoc(doc(db, 'families', familyId), newFamilyRecord).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `families/${familyId}`);
      });

      // Write to residents collection
      await setDoc(doc(db, 'residents', residentId), newResidentRecord).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `residents/${residentId}`);
      });

      // Write to users collection
      await setDoc(doc(db, 'users', uid), newUserRecord).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      });

      localStorage.removeItem('gmk_temp_registration');
      setWizardSuccess('Your family registration has been submitted successfully and is awaiting Admin approval.');
    } catch (err: any) {
      setWizardError(err.message || 'An error occurred while saving your registration to the database.');
    } finally {
      setWizardLoading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setError('Please enter your Email Address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    // Save or clear remember-me identifier
    if (rememberMe) {
      localStorage.setItem('gmk_remembered_identifier', identifier);
    } else {
      localStorage.removeItem('gmk_remembered_identifier');
    }

    try {
      await loginWithEmail(identifier, password);
    } catch (err) {
      // Errors handled / displayed through context states
    }
  };

  // Google Login execution
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
    }
  };

  // Reset password action
  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotEmail.trim()) {
      setForgotError('State a registered email address to recover your account.');
      return;
    }
    try {
      await resetPassword(forgotEmail);
      setForgotSuccess('Instructions to securely recover your account have been dispatched to your email.');
    } catch (err: any) {
      setForgotError(err.message || 'Error occurred while resetting password.');
    }
  };

  return (
    <div className="w-full h-screen min-h-screen bg-[#FAF8F2] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden font-sans relative animate-fade-in text-slate-900">
      
      {/* Soft Decorative Background Accent */}
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.04]" style={{ backgroundImage: `url(${loginBg})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F2]/90 via-[#FAF8F2] to-[#FAF8F5]" />
      
      {/* Elegant Royal Gold Top/Bottom lines resembling the Kasavu Mundu/Saree Border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#C59B27] to-transparent z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#C59B27] to-transparent z-20" />

      {/* Main Card Wrapper shifting it slightly upwards to fix the viewport perfectly */}
      <div className="w-full max-w-[340px] flex flex-col space-y-4 relative z-10 -mt-6 sm:-mt-10">
        
        {/* Header styling - Removed Logo and all Muscat/Oman references */}
        <div className="text-center space-y-1.5">
          <h1 className="font-display text-xl sm:text-2xl font-black text-[#0A422D] tracking-tight leading-none">
            Greens Malayalee Community
          </h1>
          <p className="text-[9px] sm:text-[10px] font-bold text-[#C59B27] tracking-widest uppercase mb-1">
            GMK Community Platform
          </p>
          <p className="text-[11px] sm:text-xs text-[#0A422D]/75 font-medium leading-relaxed max-w-xs mx-auto">
            Connecting families • Celebrating traditional cultural values
          </p>
        </div>

        {/* Login Card styled with gold pinstripe and cream palette */}
        <div className="bg-white/95 rounded-2xl border border-[#C59B27]/20 shadow-xl p-5 sm:p-6 relative">
          
          {/* Top golden horizontal bar inside the card */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#C59B27] to-[#D4A325] rounded-t-2xl" />

          {/* Error notifications */}
          {error && (
            <div className="mb-3 bg-rose-50 border border-rose-100 rounded-xl p-2 flex gap-2 text-rose-700 text-[11px] font-semibold animate-shake">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div className="leading-tight">{error}</div>
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-[#0A422D]/70 mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#0A422D]/40">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#0A422D]/10 rounded-xl text-slate-900 placeholder-[#0A422D]/30 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#0D4E35] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#0A422D]/70">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(true); setForgotError(''); setForgotSuccess(''); }}
                  className="text-[9px] font-bold text-[#C59B27] hover:text-[#0D4E35] cursor-pointer transition uppercase tracking-wider"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#0A422D]/40">
                  <KeyRound className="w-3.5 h-3.5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-[#FAF8F5] border border-[#0A422D]/10 rounded-xl text-slate-900 placeholder-[#0A422D]/30 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0D4E35] focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#0A422D]/40 hover:text-[#0A422D] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-sm border-[#0A422D]/20 text-[#0D4E35] focus:ring-[#0D4E35] cursor-pointer"
                />
                <span className="font-semibold text-xs text-slate-500 hover:text-[#0A422D] transition">Remember Me</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#0D4E35] to-[#0A422D] hover:from-[#0A422D] hover:to-[#083220] hover:shadow-lg hover:shadow-[#0D4E35]/15 focus:outline-hidden focus:ring-2 focus:ring-[#0D4E35] disabled:opacity-50 select-none shadow-sm cursor-pointer transition duration-300"
              >
                {loading ? 'Entering Portal...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Social Divider */}
          <div className="relative py-1.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#0A422D]/5"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest text-[#0A422D]/40 font-bold">
              <span className="bg-white px-2.5">Or</span>
            </div>
          </div>

          {/* Google SSO Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-white to-[#FAFAF8] border border-slate-205 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs duration-300"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google Sign-In
          </button>
          
        </div>

        {/* Under-card Signup callouts */}
        <div className="text-center pt-1 flex justify-center items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">New resident family?</span>
          <button
            onClick={() => setShowRegModal(true)}
            className="text-xs font-black text-[#0D4E35] hover:text-[#C59B27] hover:underline cursor-pointer transition uppercase tracking-wider"
          >
            Request Access
          </button>
        </div>

      </div>

      {/* Bottom subtle copyright / identity line - absolute positioned or flex end, kept compact */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10 text-[9px] font-black uppercase text-[#0A422D]/40 tracking-widest leading-none">
        Al Hail Greens • Greens Malayalee Community (GMK)
      </div>

        {/* ====================================================
            MODAL FOR PASSWORD RESET
         ==================================================== */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-100 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <h3 className="font-display font-bold text-slate-900 text-lg">
                Recover Password
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered active email address. We will transmit an encrypted verification link to securely update your password profile.
              </p>

              {forgotError && (
                <div className="mt-3.5 bg-rose-50 border border-rose-100 rounded-xl p-2.5 text-rose-700 text-xs font-semibold">
                  {forgotError}
                </div>
              )}

              {forgotSuccess ? (
                <div className="mt-3.5 text-center">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-950 px-2">{forgotSuccess}</p>
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="mt-4 px-4 py-1.5 bg-slate-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestReset} className="mt-4 space-y-3">
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@gmk.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-955 focus:bg-white transition"
                  />
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-3.5 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-950 text-white hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Process Reset Request
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            APPROVED GMK SELF-REGISTRATION WIZARD MODAL
         ==================================================== */}
        {showRegModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-100/80 shadow-2xl relative border-t-4 border-t-emerald-600 shadow-emerald-950/10 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Close Button top-right */}
              <button
                onClick={closeRegModal}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold transition text-lg cursor-pointer select-none"
              >
                &times;
              </button>

              {wizardSuccess ? (
                /* Success Screen state */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h3 className="font-display font-black text-slate-1000 text-xl tracking-tight">
                    Registration Submitted
                  </h3>
                  <p className="text-sm font-medium text-slate-600 max-w-sm mx-auto leading-relaxed">
                    {wizardSuccess}
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={closeRegModal}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm transition active:scale-98"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                /* Wizard Steps */
                <div>
                  {/* Step Header info */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                        Family Registration onboarding
                      </span>
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full font-mono">
                        Step {regStep} of 6
                      </span>
                    </div>

                    <h3 className="font-display font-black text-slate-950 text-lg mt-2 tracking-tight">
                      {regStep === 1 && "Start Initial Registration"}
                      {regStep === 2 && "Pre-verification Clearance"}
                      {regStep === 3 && "Establish Sign-in Credentials"}
                      {regStep === 4 && "About the Primary Representative"}
                      {regStep === 5 && "Household Members Registry"}
                      {regStep === 6 && "Directory Visibility & Privacy"}
                    </h3>
                    <p className="text-xs text-slate-450 mt-1 line-clamp-2 leading-relaxed">
                      {regStep === 1 && "Submit your core contact info to generate a verification invitation link."}
                      {regStep === 2 && "We have transmitted a mock verification email. Confirm receipt to create passkeys."}
                      {regStep === 3 && "Secure your profile handle of the family. The password must comply with community safety standards."}
                      {regStep === 4 && "Provide gender, local dial lines, and home region configuration parameters."}
                      {regStep === 5 && "Specify adults, children, or elderly parent relatives residing in the Greens Malayalee Community household at Al Hail Greens, Muscat, Oman."}
                      {regStep === 6 && "Review final directives and choose visibility parameters in the resident indices."}
                    </p>

                    {/* Progress tracking line */}
                    <div className="mt-4 flex gap-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      {[1, 2, 3, 4, 5, 6].map((stepNum) => (
                        <div
                          key={stepNum}
                          className={`h-full flex-1 transition-all duration-300 ${
                            stepNum <= regStep ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-slate-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Inline Wizard Errors alerts */}
                  {wizardError && (
                    <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl p-3 flex gap-2 text-rose-700 text-xs font-medium animate-shake">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>{wizardError}</div>
                    </div>
                  )}

                  {/* FORM FIELDS PER STEP */}
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    
                    {/* ======= STEP 1: INITIAL REGISTRATION ======= */}
                    {regStep === 1 && (
                      <div className="space-y-3.5">
                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-800 leading-normal">
                          <strong>Note:</strong> Password will not be collected during initial signup. You will create password immediately after completing email verification.
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Building Number
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <Building className="w-4 h-4 text-slate-400" />
                              </span>
                              <input
                                type="text"
                                required
                                value={regBuildingNumber}
                                onChange={(e) => setRegBuildingNumber(e.target.value.toUpperCase())}
                                placeholder="e.g. B3-04"
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition uppercase"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Flat Number
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <Building className="w-4 h-4 text-slate-400" />
                              </span>
                              <input
                                type="text"
                                required
                                value={regUnitNumber}
                                onChange={(e) => setRegUnitNumber(e.target.value.toUpperCase())}
                                placeholder="e.g. 01"
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-900 text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition uppercase"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Primary Adult Representative Name
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={regPrimaryTitle}
                              onChange={(e) => setRegPrimaryTitle(e.target.value)}
                              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:outline-hidden cursor-pointer"
                            >
                              <option value="Mr.">Mr.</option>
                              <option value="Dr.">Dr.</option>
                              <option value="Mrs.">Mrs.</option>
                              <option value="Mstr.">Mstr.</option>
                              <option value="Ms.">Ms.</option>
                            </select>
                            <input
                              type="text"
                              required
                              value={regPrimaryName}
                              onChange={(e) => setRegPrimaryName(e.target.value)}
                              onBlur={() => setRegPrimaryName(formatSentenceCase(regPrimaryName))}
                              placeholder="e.g. Sunil Gopinath"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Select salutation and name. Automatically converted to proper Sentence Case on text field blur.
                          </p>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Active Email Address
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-405">
                              <Mail className="w-4 h-4" />
                            </span>
                            <input
                              type="email"
                              required
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="e.g. sunil@gmk.com"
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            A valid email verification link will protect and authenticate your profile database.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ======= STEP 2: EMAIL VERIFICATION NOTICE & SIMULATOR ======= */}
                    {regStep === 2 && (
                      <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 text-emerald-950 font-medium text-xs leading-normal flex gap-3">
                          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-emerald-900 block text-sm mb-1">
                              Verification Email Transmitted!
                            </span>
                            Verification email sent to <strong className="underline text-emerald-905">{regEmail}</strong>. Please verify your email address to continue your registration. We have safely logged your pending record.
                          </div>
                        </div>

                        {(import.meta as any).env.DEV ? (
                          <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 border border-slate-800 space-y-3.5 shadow-md">
                            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
                              <Mail className="w-4 h-4 text-indigo-400" />
                              <span className="font-display font-bold text-xs text-white">
                                Sandboxed Preview Email Inbox simulator
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Since you are exploring in a local web preview environment, you can trigger the simulated email callback action manually to instantly unlock password creation:
                            </p>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left font-sans text-xs space-y-1.5 text-slate-300">
                              <p><strong>To:</strong> <span className="text-emerald-400 underline">{regEmail || "your-email@gmk.com"}</span></p>
                              <p><strong>Subject:</strong> Activate Your Greens Malayalee Community (GMK) Membership Account</p>
                              <hr className="border-slate-850 my-1" />
                              <p className="text-[10px] text-slate-405 italic">
                                "Greetings {regPrimaryName || "Resident"}. Link expires in 24 hours."
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setRegStep(3); // Transition directly to Password Setup Step!
                              }}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm transition active:scale-98 flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" /> Simulate Email Verification Link Click
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-xs">
                            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span className="font-display font-medium text-xs text-slate-900">
                                Production Firebase Auth Verification
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed text-left">
                              Once you have clicked the link inside the verification email sent to <strong className="text-slate-800">{regEmail}</strong>, click the status button below to advance to your password credentials setup.
                            </p>
                            
                            <div className="flex flex-col gap-2 pt-1">
                              <button
                                type="button"
                                disabled={wizardLoading}
                                onClick={handleCheckVerification}
                                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white disabled:opacity-50 rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition flex items-center justify-center gap-2"
                              >
                                {wizardLoading ? (
                                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                Check Verification Status
                              </button>

                              <button
                                type="button"
                                disabled={wizardLoading}
                                onClick={handleResendVerification}
                                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-50 rounded-xl text-xs font-medium cursor-pointer transition flex items-center justify-center gap-1 border border-slate-200"
                              >
                                Resend Verification Link
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ======= STEP 3: CREATE PASSWORD ======= */}
                    {regStep === 3 && (
                      <div className="space-y-4">
                        <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-3.5 space-y-2 text-left">
                          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide block">
                            🔑 Password Security Policy:
                          </span>
                          <p className="text-xs text-indigo-955 leading-relaxed font-semibold mb-2">
                            Minimum limit is set to <strong className="font-black underline text-indigo-800">{minPasswordLength} characters</strong> (managed securely by administrators in system settings).
                          </p>

                          {/* Real-time Checklist of Complexity Settings */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 pt-1 border-t border-indigo-100">
                            <div className="flex items-center gap-1.5 text-[10.5px]">
                              {regPassword.length >= minPasswordLength ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-400 shrink-0">1</span>
                              )}
                              <span className={regPassword.length >= minPasswordLength ? "text-emerald-800 font-bold" : "text-slate-500 font-medium"}>
                                At least {minPasswordLength} characters
                              </span>
                            </div>

                            {reqUppercase && (
                              <div className="flex items-center gap-1.5 text-[10.5px]">
                                {/[A-Z]/.test(regPassword) ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-400 shrink-0">2</span>
                                )}
                                <span className={/[A-Z]/.test(regPassword) ? "text-emerald-800 font-bold" : "text-slate-500 font-medium"}>
                                  Uppercase letter (A-Z)
                                </span>
                              </div>
                            )}

                            {reqLowercase && (
                              <div className="flex items-center gap-1.5 text-[10.5px]">
                                {/[a-z]/.test(regPassword) ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-400 shrink-0">3</span>
                                )}
                                <span className={/[a-z]/.test(regPassword) ? "text-emerald-800 font-bold" : "text-slate-500 font-medium"}>
                                  Lowercase letter (a-z)
                                </span>
                              </div>
                            )}

                            {reqNumber && (
                              <div className="flex items-center gap-1.5 text-[10.5px]">
                                {/[0-9]/.test(regPassword) ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-400 shrink-0">4</span>
                                )}
                                <span className={/[0-9]/.test(regPassword) ? "text-emerald-800 font-bold" : "text-slate-500 font-medium"}>
                                  Numeric digit (0-9)
                                </span>
                              </div>
                            )}

                            {reqSpecial && (
                              <div className="flex items-center gap-1.5 text-[10.5px]">
                                {/[!@#$%^&*(),.?":{}|<>]/.test(regPassword) ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-400 shrink-0">5</span>
                                )}
                                <span className={/[!@#$%^&*(),.?":{}|<>]/.test(regPassword) ? "text-emerald-800 font-bold" : "text-slate-500 font-medium"}>
                                  Special char (!@#$%^&*)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Create Password
                            </label>
                            <span className="text-[10px] font-bold text-slate-500 font-mono">
                              System Requirement: &ge;{minPasswordLength} Chars
                            </span>
                          </div>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-405">
                              <Lock className="w-4 h-4" />
                            </span>
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-905 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                              tabIndex={-1}
                            >
                              {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-405">
                              <Lock className="w-4 h-4" />
                            </span>
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-905 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
                            />
                          </div>
                        </div>

                        {/* Real-time policy strength bars */}
                        {regPassword && (
                          <div className="space-y-1.5 pt-1.5">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-450 uppercase tracking-widest leading-none">Password strength:</span>
                              <span className="font-extrabold">{evaluatePasswordStrength(regPassword).label}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                              <div 
                                className={`h-full transition-all duration-300 ${evaluatePasswordStrength(regPassword).score >= 1 ? 'bg-rose-500' : 'bg-transparent'}`} 
                                style={{ width: '25%' }}
                              />
                              <div 
                                className={`h-full transition-all duration-300 border-l border-white ${evaluatePasswordStrength(regPassword).score >= 2 ? 'bg-amber-500' : 'bg-transparent'}`} 
                                style={{ width: '25%' }}
                              />
                              <div 
                                className={`h-full transition-all duration-300 border-l border-white ${evaluatePasswordStrength(regPassword).score >= 3 ? 'bg-blue-500' : 'bg-transparent'}`} 
                                style={{ width: '25%' }}
                              />
                              <div 
                                className={`h-full transition-all duration-300 border-l border-white ${evaluatePasswordStrength(regPassword).score >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`} 
                                style={{ width: '25%' }}
                              />
                            </div>
                          </div>
                        )}

                        {regPassword && regConfirmPassword && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            {regPassword === regConfirmPassword ? (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <Check className="w-4 h-4" /> Passwords match perfectly.
                              </span>
                            ) : (
                              <span className="text-rose-600">
                                Passwords do not match yet.
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ======= STEP 4: PRIMARY ADULT BIOGRAPHICAL ======= */}
                    {regStep === 4 && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[11px] text-slate-500 text-center uppercase tracking-wider font-bold">
                          Profile Details
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Gender
                          </label>
                          <div className="flex gap-4">
                            {['Male', 'Female'].map((g) => (
                              <label key={g} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-650">
                                <input
                                  type="radio"
                                  name="reg_primary_gender"
                                  checked={regPrimaryGender === g}
                                  onChange={() => setRegPrimaryGender(g as any)}
                                  className="w-4 h-4 border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                />
                                {g}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3.5">
                          {/* Phone number input with country code dropdown */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                              <select
                                value={regPhoneCountry}
                                onChange={(e) => setRegPhoneCountry(e.target.value)}
                                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:outline-hidden cursor-pointer"
                              >
                                <option value="+968">Oman (+968)</option>
                                <option value="+91">India (+91)</option>
                                <optgroup label="Other Countries">
                                  <option value="+973">Bahrain (+973)</option>
                                  <option value="+1">Canada (+1)</option>
                                  <option value="+20">Egypt (+20)</option>
                                  <option value="+49">Germany (+49)</option>
                                  <option value="+965">Kuwait (+965)</option>
                                  <option value="+60">Malaysia (+60)</option>
                                  <option value="+92">Pakistan (+92)</option>
                                  <option value="+974">Qatar (+974)</option>
                                  <option value="+966">Saudi Arabia (+966)</option>
                                  <option value="+65">Singapore (+65)</option>
                                  <option value="+94">Sri Lanka (+94)</option>
                                  <option value="+971">United Arab Emirates (+971)</option>
                                  <option value="+44">United Kingdom (+44)</option>
                                  <option value="+1">United States (+1)</option>
                                </optgroup>
                              </select>
                              <input
                                type="text"
                                required
                                value={regPhoneDigits}
                                onChange={(e) => setRegPhoneDigits(e.target.value.replace(/\D/g, ''))}
                                placeholder="Phone number (no spaces)"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-mono"
                              />
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1">
                              {regPhoneCountry === '+968' ? 'Oman numbers must be exactly 8 digits.' : regPhoneCountry === '+91' ? 'India numbers must be exactly 10 digits.' : 'Enter contact digits without country code prefix.'}
                            </p>
                          </div>

                          {/* WhatsApp: check if same */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/70">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-705">
                              <input
                                type="checkbox"
                                checked={isWhatsAppSame}
                                onChange={(e) => setIsWhatsAppSame(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                              <span>Is WhatsApp number same as Phone number?</span>
                            </label>
                          </div>

                          {/* WhatsApp conditional details */}
                          {!isWhatsAppSame && (
                            <div className="p-3 bg-emerald-50/20 border border-emerald-500/10 rounded-xl space-y-3 animate-in fade-in duration-200">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                WhatsApp Number <span className="text-red-500">*</span>
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={regWhatsAppCountry}
                                  onChange={(e) => setRegWhatsAppCountry(e.target.value)}
                                  className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:outline-hidden cursor-pointer"
                                >
                                  <option value="+968">Oman (+968)</option>
                                  <option value="+91">India (+91)</option>
                                  <optgroup label="Other Countries">
                                    <option value="+973">Bahrain (+973)</option>
                                    <option value="+1">Canada (+1)</option>
                                    <option value="+20">Egypt (+20)</option>
                                    <option value="+49">Germany (+49)</option>
                                    <option value="+965">Kuwait (+965)</option>
                                    <option value="+60">Malaysia (+60)</option>
                                    <option value="+92">Pakistan (+92)</option>
                                    <option value="+974">Qatar (+974)</option>
                                    <option value="+966">Saudi Arabia (+966)</option>
                                    <option value="+65">Singapore (+65)</option>
                                    <option value="+94">Sri Lanka (+94)</option>
                                    <option value="+971">United Arab Emirates (+971)</option>
                                    <option value="+44">United Kingdom (+44)</option>
                                    <option value="+1">United States (+1)</option>
                                  </optgroup>
                                </select>
                                <input
                                  type="text"
                                  required
                                  value={regWhatsAppDigits}
                                  onChange={(e) => setRegWhatsAppDigits(e.target.value.replace(/\D/g, ''))}
                                  placeholder="WhatsApp number (no spaces)"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-mono"
                                />
                              </div>
                              <p className="text-[9px] text-slate-400">
                                {regWhatsAppCountry === '+968' ? 'Oman WhatsApp numbers must be exactly 8 digits.' : regWhatsAppCountry === '+91' ? 'India WhatsApp numbers must be exactly 10 digits.' : 'Enter contact digits without country code prefix.'}
                              </p>
                            </div>
                          )}

                          {/* Profession & Company: Triggered ONLY if Representative Gender is Male */}
                          {regPrimaryGender === 'Male' && (
                            <div className="grid grid-cols-2 gap-3.5 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                  Profession Designation <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={regPrimaryProfession}
                                  onChange={(e) => setRegPrimaryProfession(e.target.value)}
                                  placeholder="e.g. Software Consultant"
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition animate-pulse-once"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                  Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={regPrimaryCompany}
                                  onChange={(e) => setRegPrimaryCompany(e.target.value)}
                                  placeholder="e.g. Muscat Tech Partners"
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition animate-pulse-once"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ======= STEP 5: ADDITIONAL MEMBERS REGISTRY ======= */}
                    {regStep === 5 && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Expandable Member Creation Form */}
                        {!showAddForm ? (
                          <button
                            type="button"
                            onClick={() => setShowAddForm(true)}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-550 to-lime-500 hover:from-emerald-700 hover:via-emerald-650 hover:to-lime-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer select-none active:scale-98 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20"
                          >
                            <Plus className="w-4 h-4" /> Add Household Member
                          </button>
                        ) : (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-205 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center pb-1 border-b border-slate-150">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                Member Information
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddForm(false);
                                  setWizardError('');
                                }}
                                className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition select-none"
                              >
                                Cancel
                              </button>
                            </div>
                            
                            <div className="space-y-2.5">
                              <div className="flex gap-2">
                                <select
                                  value={newMemTitle}
                                  onChange={(e) => setNewMemTitle(e.target.value)}
                                  className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:outline-hidden cursor-pointer"
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
                                  placeholder="Full Name (e.g. Mini Sunil)"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-900 transition"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <select
                                    value={newMemRelationship}
                                    onChange={(e: any) => {
                                      setNewMemRelationship(e.target.value);
                                      if (e.target.value !== 'Child') {
                                        setNewMemYearOfBirth('');
                                      }
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-705 text-xs font-semibold focus:outline-hidden cursor-pointer placeholder-gray-400"
                                  >
                                    <option value="" disabled className="text-slate-300">Relationship...</option>
                                    <option value="Spouse">Spouse / Partner</option>
                                    <option value="Parent">Parent</option>
                                    <option value="Child">Child</option>
                                    <option value="Other">Other Adults / Dependants</option>
                                  </select>
                                </div>
                                <div>
                                  <select
                                    value={newMemGender}
                                    onChange={(e: any) => setNewMemGender(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-705 text-xs font-semibold focus:outline-hidden cursor-pointer placeholder-gray-400"
                                  >
                                    <option value="" disabled className="text-slate-300">Gender...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                  </select>
                                </div>
                              </div>

                              {newMemRelationship === 'Child' && (
                                <div className="pt-0.5 animate-in fade-in duration-200">
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Year of Birth <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={newMemYearOfBirth}
                                    onChange={(e) => setNewMemYearOfBirth(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Year of Birth (YYYY) - e.g. 2018"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-900 transition font-mono"
                                  />
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={handleAddMember}
                                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-semibold select-none cursor-pointer transition flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" /> Register Member
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Listed added members */}
                        <div className="pt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                            Added Adults, Parents & Children ({additionalMembers.length})
                          </span>
                          
                          {additionalMembers.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4 text-center bg-slate-50/50 rounded-xl border border-dashed">
                              No additional family dependants catalogued yet.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                              {additionalMembers.map((mem, index) => (
                                <div key={index} className="flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-2.5 rounded-xl transition animate-in fade-in duration-300">
                                  <div>
                                    <span className="text-xs font-bold text-slate-900 block">{mem.name}</span>
                                    <span className="text-[10px] text-slate-450 font-semibold">
                                      {mem.relationship} • {mem.gender}
                                      {mem.relationship === 'Child' && mem.yearOfBirth && ` • Born in ${mem.yearOfBirth}`}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(index)}
                                    className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ======= STEP 6: DIRECTORY PRIVACY & CONFIRMATION ======= */}
                    {regStep === 6 && (
                      <div className="space-y-4">
                        <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-3.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Privacy Preference Options
                          </span>
                          
                          <div className="space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={prefIsVisible}
                                onChange={(e) => setPrefIsVisible(e.target.checked)}
                                className="w-4.5 h-4.5 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 mt-0.5 cursor-pointer"
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">Allow listing family profile on public directory</span>
                                <span className="text-[10px] text-slate-400 block leading-normal">Allows other verified Greens Malayalee Community (GMK) members to see your family profile.</span>
                              </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={prefShowPhone}
                                onChange={(e) => setPrefShowPhone(e.target.checked)}
                                className="w-4.5 h-4.5 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 mt-0.5 cursor-pointer"
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">Show contact phone number in directory</span>
                                <span className="text-[10px] text-slate-400 block leading-normal">Permits neighbors to call or trace dial lines for support.</span>
                              </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={prefShowProfession}
                                onChange={(e) => setPrefShowProfession(e.target.checked)}
                                className="w-4.5 h-4.5 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 mt-0.5 cursor-pointer"
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">Show professional designation on profile</span>
                                <span className="text-[10px] text-slate-400 block leading-normal">Helps neighbor networks cross-collaborate.</span>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Confirmation summary spreadsheet pre-rendered */}
                        <div className="border border-slate-150 rounded-xl p-3.5 text-xs space-y-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b">
                            onboarding dossier summary
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-[11px] leading-relaxed">
                            <p className="text-slate-400">Representative Name:</p>
                            <p className="font-semibold text-slate-900">{regPrimaryName}</p>
                            
                            <p className="text-slate-400">Flat Number Location:</p>
                            <p className="font-semibold text-slate-900 uppercase font-mono">{regBuildingNumber ? `${regBuildingNumber} / ${regUnitNumber}` : regFlatNumber}</p>
                            
                            <p className="text-slate-400">Verified Email Address:</p>
                            <p className="font-semibold text-slate-900 font-mono text-[10px]">{regEmail}</p>

                            <p className="text-slate-400">Representative Country:</p>
                            <p className="font-semibold text-slate-900">{regCountry}</p>

                            <p className="text-slate-400">Contact Line:</p>
                            <p className="font-semibold text-slate-900 font-mono">{regPhone}</p>

                            <p className="text-slate-400">Additional Family Size:</p>
                            <p className="font-bold text-slate-800 font-mono bg-slate-100 px-2 py-0.2 rounded shrink-0 w-max">{additionalMembers.length} additions</p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* NAVIGATION CONTROL FOOTERS */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between gap-3">
                    {regStep > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer select-none"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={closeRegModal}
                        className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer select-none"
                      >
                        Cancel
                      </button>
                    )}

                    {regStep < 6 ? (
                      /* Disallow going past Step 2 manually without simulation button */
                      regStep === 2 ? (
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center text-center py-2 shrink-0">
                          Verify Email to Proceed ✉️
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer select-none shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-98"
                        >
                          Next Step <ArrowRight className="w-4 h-4" />
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={handleWizardSubmit}
                        className="inline-flex items-center gap-1.5 px-6 py-2 bg-gradient-to-r from-emerald-600 to-lime-500 hover:from-emerald-700 hover:to-lime-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md shadow-emerald-600/15 active:scale-98 select-none"
                      >
                        <Check className="w-4 h-4" /> Submit Registration
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
    </div>
  );
}
