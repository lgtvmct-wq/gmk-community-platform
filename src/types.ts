export type UserRole = 'resident' | 'admin' | 'superAdmin' | 'president' | 'vicePresident' | 'eventDirector';

export interface UserProfile {
  uid: string;
  email: string;
  roles: UserRole[];
  residentRef?: string;
  isActive: boolean;
  createdAt: string;
}

export interface DirectoryVisibility {
  isVisible: boolean;
  showPhoneNumber: boolean;
  showProfession: boolean;
  showCompanyName: boolean;
}

export interface ResidentProfile {
  id?: string;
  familyRef: string;
  fullName: string;
  gender: 'Male' | 'Female';
  residentType: 'primaryAdult' | 'additionalAdult' | 'parent' | 'child';
  relationship: 'Self' | 'Spouse' | 'Son' | 'Daughter' | 'Father' | 'Mother' | 'Other' | string;
  isParent: boolean;
  email?: string;
  phone?: string;
  whatsApp?: string;
  profession?: string;
  companyName?: string;
  yearOfBirth?: number;
  directoryVisibility: DirectoryVisibility;
  eventCommitteeAssignments?: string[]; // array of eventId-committeeId strings
  buildingNumber?: string;
  unitNumber?: string;
  flatNumber?: string; // Stored normalized B30401
}

export interface AdditionalMember {
  name: string;
  relationship: 'Spouse' | 'Parent' | 'Child' | 'Other';
  gender: 'Male' | 'Female';
  yearOfBirth?: string;
}

export interface FamilyProfile {
  id?: string;
  gmkId: string; // format: GMK000001
  buildingNumber: string; // e.g., B3-04
  unitNumber: string; // e.g., 01
  flatNumber: string; // e.g., B30401 (normalized)
  primaryName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  status: 'active' | 'pendingApproval' | 'former';
  membersCount: number;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  members?: AdditionalMember[];
}

export interface AuthState {
  user: any; // Firebase User or null
  profile: UserProfile | null;
  resident: ResidentProfile | null;
  family: FamilyProfile | null;
  loading: boolean;
  error: string | null;
}
