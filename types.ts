export enum SubscriptionTier {
  Free = 'free',
  Premium = 'premium',
}

export interface User {
  id: string;
  email: string;
  tier: SubscriptionTier;
}

export interface Vehicle {
  year: string;
  make: string;
  model: string;
}

export interface RepairStep {
  step: number;
  instruction: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface RepairGuide {
  id: string; // Unique identifier for the guide
  title: string;
  vehicle: string;
  safetyWarnings: string[];
  tools: string[];
  parts: string[];
  steps: RepairStep[];
  sources?: GroundingSource[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  imageUrl?: string | null;
}

// New Types for Vehicle Info Analysis
export interface TSB {
  bulletinNumber: string;
  title: string;
  summary: string;
}

export interface Recall {
  campaignNumber: string;
  title: string;
  consequence: string;
}

export interface JobSnapshot {
  difficulty: string; // e.g., "Easy", "Intermediate", "Hard"
  estimatedTime: string; // e.g., "1-2 hours"
  estimatedPartsCost: string; // e.g., "$50 - $100"
  potentialSavings: string; // e.g., "~$200 vs. dealership"
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface VehicleInfo {
  jobSnapshot: JobSnapshot;
  tsbs: TSB[];
  recalls: Recall[];
  sources?: GroundingSource[];
}

// New Type for History
export interface HistoryItem {
  id: string;
  title: string;
  vehicle: string;
  timestamp: number;
}

export interface AffiliateLink {
  provider: string; // e.g., 'Amazon'
  url: string;
  price: string;
}