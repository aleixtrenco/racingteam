export const DISCIPLINES = ['Road', 'Mountainbike', 'Triathlon'] as const;
export const STATUSES = ['Confirmed', 'Tentative', 'Cancelled'] as const;
export const PRIORITIES = ['High', 'Medium', 'Low'] as const;

export type Discipline = (typeof DISCIPLINES)[number];
export type RaceStatus = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Role = 'athlete' | 'admin';

export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  avatar_url: string | null;
  disciplines: Discipline[];
  tshirt_size: (typeof TSHIRT_SIZES)[number] | null;
  bio: string | null;
  strava_url: string | null;
  instagram: string | null;
  onboarded_at: string | null;
}

export interface Race {
  id: string;
  event_name: string;
  race_date: string; // yyyy-mm-dd (first day)
  end_date: string | null; // last day of a multi-day event
  location: string | null;
  status: RaceStatus;
  priority: Priority;
  discipline: Discipline;
  athletes_racing_note: string | null;
  team_entry_only: boolean;
  external_id: string | null;
}

export interface Registration {
  id: string;
  race_id: string;
  race_name: string;
  race_date: string | null;
  user_id: string | null;
  athlete_name: string;
  athlete_email: string;
  note: string | null;
  recap_sent: boolean;
  created_at: string;
}

export interface RaceResult {
  id: string;
  race_id: string | null;
  race_name: string;
  race_date: string | null;
  user_id: string | null;
  athlete_name: string;
  overall_position: number | null;
  result_text: string | null;
  notes: string | null;
  photos: string[];
  created_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  tier: 1 | 2;
  display_order: number;
}
