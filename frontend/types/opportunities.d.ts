// Opportunity filtering and API types

export interface OpportunityFilters {
  limit?: number;
  page?: number;
  sortBy?: string;
  states?: string[];
  program?: string;
  fields?: string[];
  category?: string;
}

export interface FeaturedOpportunityFilters {
  limit?: number;
  page?: number;
  type?: string[];
}

export interface OpportunityItem {
  _id?: string;
  title: string;
  description: string;
  institution: string;
  organization?: string; // Added organization field
  duration: string;
  workType: string;
  states?: string; // Added states field
  startDate?: string;
  eligibility?: string;
  tags?: string[];
  bannerImage?: string;
  applicationUrl?: string;
  [key: string]: any;
}

export interface OpportunityResponse {
  opportunities: OpportunityItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface OpportunitySearchFilters {
  states?: string[];
  program?: string;
  fields?: string[];
  workType?: string[];
  duration?: string[];
  [key: string]: any;
}

export interface ApplicationFilters {
  limit?: number;
  page?: number;
  sortBy?: string;
  status?: string;
  [key: string]: any;
}
