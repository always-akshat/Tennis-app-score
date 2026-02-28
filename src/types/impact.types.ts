// ============================================
// KHEL SATHI - SOCIAL IMPACT TYPES
// ============================================

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const ISSUE_CATEGORIES = [
  'broken_facility',
  'no_equipment',
  'safety_hazard',
  'waterlogged',
  'encroachment',
  'no_lighting',
  'accessibility',
  'other',
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  broken_facility: 'Broken Facility',
  no_equipment: 'No Equipment',
  safety_hazard: 'Safety Hazard',
  waterlogged: 'Waterlogged Ground',
  encroachment: 'Encroachment',
  no_lighting: 'No Lighting',
  accessibility: 'Accessibility Issue',
  other: 'Other',
};

export const ISSUE_STATUSES = ['open', 'acknowledged', 'in_progress', 'resolved', 'closed'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const VOLUNTEER_SKILLS = [
  'coaching_tennis',
  'coaching_cricket',
  'coaching_football',
  'coaching_badminton',
  'coaching_athletics',
  'fitness_training',
  'sports_medicine',
  'event_management',
  'fundraising',
  'mentoring',
  'equipment_repair',
  'facility_maintenance',
] as const;

export type VolunteerSkill = (typeof VOLUNTEER_SKILLS)[number];

export const VOLUNTEER_SKILL_LABELS: Record<VolunteerSkill, string> = {
  coaching_tennis: 'Tennis Coaching',
  coaching_cricket: 'Cricket Coaching',
  coaching_football: 'Football Coaching',
  coaching_badminton: 'Badminton Coaching',
  coaching_athletics: 'Athletics Coaching',
  fitness_training: 'Fitness Training',
  sports_medicine: 'Sports Medicine',
  event_management: 'Event Management',
  fundraising: 'Fundraising',
  mentoring: 'Youth Mentoring',
  equipment_repair: 'Equipment Repair',
  facility_maintenance: 'Facility Maintenance',
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry', 'Ladakh', 'J&K',
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

// ============================================
// COMMUNITY ISSUES
// ============================================

export interface CommunityIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  location: string;
  district: string;
  state: IndianState;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
  reportedBy: string;
  reporterName: string;
  upvotes: number;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIssueRequest {
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  district: string;
  state: IndianState;
  pincode: string;
}

// ============================================
// VOLUNTEERS
// ============================================

export interface Volunteer {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone: string;
  skills: VolunteerSkill[];
  bio: string;
  district: string;
  state: IndianState;
  availableWeekdays: boolean;
  availableWeekends: boolean;
  hoursPerWeek: number;
  isVerified: boolean;
  totalHoursLogged: number;
  communitiesServed: number;
  createdAt: Date;
}

export interface CreateVolunteerRequest {
  displayName: string;
  phone: string;
  skills: VolunteerSkill[];
  bio: string;
  district: string;
  state: IndianState;
  availableWeekdays: boolean;
  availableWeekends: boolean;
  hoursPerWeek: number;
}

// ============================================
// IMPACT STORIES
// ============================================

export interface ImpactStory {
  id: string;
  title: string;
  summary: string;
  body: string;
  coverImageUrl: string | null;
  authorName: string;
  district: string;
  state: IndianState;
  sport: string;
  participantsImpacted: number;
  tags: string[];
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
}

// ============================================
// COMMUNITIES (PROGRAM LOCATIONS)
// ============================================

export interface Community {
  id: string;
  name: string;
  district: string;
  state: IndianState;
  pincode: string;
  totalYouth: number;
  girlsParticipation: number;
  boysParticipation: number;
  activeSports: string[];
  facilitiesAvailable: string[];
  volunteersAssigned: number;
  isActive: boolean;
  createdAt: Date;
}

// ============================================
// IMPACT DASHBOARD STATS
// ============================================

export interface ImpactStats {
  totalCommunities: number;
  totalYouthReached: number;
  girlsParticipation: number;
  boysParticipation: number;
  genderRatio: number; // percentage of girls
  totalVolunteers: number;
  totalHoursVolunteered: number;
  openIssues: number;
  resolvedIssues: number;
  statesReached: number;
  districtsReached: number;
  storiesPublished: number;
}

export interface StateWiseStats {
  state: IndianState;
  communities: number;
  youthReached: number;
  volunteers: number;
  openIssues: number;
}

export interface MonthlyGrowth {
  month: string;
  youthReached: number;
  girlsReached: number;
  volunteersJoined: number;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface IssueCardProps {
  issue: CommunityIssue;
  onUpvote?: (id: string) => void;
  compact?: boolean;
}

export interface VolunteerCardProps {
  volunteer: Volunteer;
  onConnect?: (id: string) => void;
}

export interface StoryCardProps {
  story: ImpactStory;
}

export interface StatCardProps {
  label: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'red';
}
