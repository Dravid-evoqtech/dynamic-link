import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { applicationsAPI, savedAPI, userAPI, referralAPI, opportunitiesAPI } from './api';

export const queryKeys = {
  profile: ['user', 'profile'] as const,
  stats: ['applications', 'stats'] as const,
  saved: ['opportunities', 'saved'] as const,
  applications: (filter: string | undefined) => ['applications', { filter: filter || 'All' }] as const,
  referralLink: (userId: string | undefined) => ['referral', 'link', userId] as const,
  categories: ['opportunities', 'categories'] as const,
  featured: (filters: { type: string; program: string; sortBy: string } | undefined) => ['opportunities', 'featured', filters] as const,
  opportunities: (filters: { type: string; program: string; sortBy: string } | undefined, category?: string | null) => ['opportunities', 'all', filters, category] as const,
  search: (query: string, filters: any) => ['opportunities', 'search', { query, ...filters }] as const,
};

export function useProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const response = await userAPI.getProfile();
      return response.data || response;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false, // Don't refetch when component mounts if data is fresh
  });
}

export function useApplicationStatsQuery() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => {
      const response = await applicationsAPI.getStats();
      return response.data || response;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSavedOpportunitiesQuery() {
  return useQuery({
    queryKey: queryKeys.saved,
    queryFn: async () => {
      const response = await savedAPI.getSaved();
      const opportunities = response.data?.opportunities || response.opportunities || [];
      return Array.isArray(opportunities) ? opportunities : [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false, // Don't refetch when component mounts if data is fresh
  });
}

export function useSaveOpportunityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    // Accept both id and the full opportunity so we can update cache instantly
    mutationFn: async (payload: { opportunityId: string; opportunity: any }) => {
      await savedAPI.save(payload.opportunityId);
      return payload.opportunity;
    },
    onSuccess: (opportunity) => {
      queryClient.setQueryData<any[]>(queryKeys.saved, (prev) => {
        const previous = Array.isArray(prev) ? prev : [];
        // Avoid duplicates
        if (previous.some((opp) => (opp as any)?._id === (opportunity as any)?._id)) {
          return previous;
        }
        // Add to the beginning for immediate visibility
        return [opportunity, ...previous];
      });
    },
  });
}

export function useApplicationsQuery(filter: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications(filter),
    queryFn: async () => {
      const filters: any = {};
      if (filter && filter !== 'All') filters.status = filter;
      const response = await applicationsAPI.getUserApplications(filters);
      const apps = response.data?.applications || response.applications || [];
      return Array.isArray(apps) ? apps : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useReferralLinkQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.referralLink(userId),
    queryFn: async () => {
      if (!userId) return null as string | null;
      const referralResponse = await referralAPI.createReferral(userId, '1', '1');
      const data = referralResponse?.data || referralResponse;
      return data?.link || null;
    },
    enabled: Boolean(userId),
    staleTime: 30 * 60 * 1000,
  });
}

export function useUnsaveOpportunityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opportunityId: string) => {
      await savedAPI.remove(opportunityId);
      return opportunityId;
    },
    onSuccess: (opportunityId) => {
      queryClient.setQueryData<any[]>(queryKeys.saved, (prev) =>
        Array.isArray(prev) ? prev.filter((opp) => opp._id !== opportunityId) : prev
      );
    },
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const response = await opportunitiesAPI.getCategories();
      const categories = response.data?.categories || response.categories || [];
      return Array.isArray(categories) ? categories : [];
    },
    staleTime: 60 * 60 * 1000,
    refetchOnMount: false, // Don't refetch when component mounts if data is fresh
  });
}

type ExploreFilters = { type: string; program: string; sortBy: string } | undefined;

function mapTypeToStates(type: string | undefined) {
  if (!type || type === 'All') return undefined;
  const mapping: Record<string, string> = {
    'Remote': 'Remote',
    'In-Person': 'In Person',
    'Hybrid': 'Hybrid',
  };
  return mapping[type] ? [mapping[type]] : undefined;
}

export function useFeaturedInfiniteQuery(filters: ExploreFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.featured(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const featuredFilters: any = {
        limit: pageParam === 1 ? 2 : 4,
        page: pageParam,
      };
      const states = mapTypeToStates(filters?.type);
      if (states) featuredFilters.type = states; // API uses `type` array for featured
      const response = await opportunitiesAPI.getFeatured(featuredFilters);
      const items = response.data?.opportunities || response.opportunities || [];
      const totalPages = response.data?.pagination?.totalPages || 1;
      return { items, page: pageParam, totalPages };
    },
    getNextPageParam: (lastPage: any) => {
      const next = ((lastPage?.page as number) || 1) + 1;
      return next <= ((lastPage?.totalPages as number) || 1) ? next : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 minutes
    refetchOnMount: false, // Don't refetch when component mounts if data is fresh
  });
}

export function useOpportunitiesInfiniteQuery(filters: ExploreFilters, enabled: boolean = true, selectedCategory?: string | null) {
  const queryKey = queryKeys.opportunities(filters, selectedCategory);
  console.log('[useOpportunitiesInfiniteQuery] Query key:', queryKey);
  
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const opportunityFilters: any = {
        limit: 20, // Use consistent limit for all pages
        page: pageParam,
        sortBy: filters?.sortBy || 'Featured',
      };
      const states = mapTypeToStates(filters?.type);
      if (states) opportunityFilters.states = states;
      
      // Add category filter if selected - include in fields array
      if (selectedCategory) {
        opportunityFilters.fields = [selectedCategory];
        console.log('[useOpportunitiesInfiniteQuery] Category filter applied:', selectedCategory);
      }
      
      console.log('[useOpportunitiesInfiniteQuery] API request filters:', opportunityFilters);
      const response = await opportunitiesAPI.getAll(opportunityFilters);
      const items = response.data?.opportunities || response.opportunities || [];
      const totalPages = response.data?.pagination?.totalPages || 1;
      const totalItems = response.data?.pagination?.totalItems || items.length;
      
      console.log(`[useOpportunitiesInfiniteQuery] Page ${pageParam}: ${items.length} items, Total: ${totalItems}, Pages: ${totalPages}`);
      console.log('[useOpportunitiesInfiniteQuery] Response pagination:', response.data?.pagination);
      
      return { items, page: pageParam, totalPages, totalItems };
    },
    getNextPageParam: (lastPage: any) => {
      const currentPage = (lastPage?.page as number) || 1;
      const totalPages = (lastPage?.totalPages as number) || 1;
      const next = currentPage + 1;
      const hasNext = next <= totalPages;
      
      console.log(`[getNextPageParam] Current page: ${currentPage}, Total pages: ${totalPages}, Next page: ${next}, Has next: ${hasNext}`);
      
      return hasNext ? next : undefined;
    },
    initialPageParam: 1,
    enabled,
    staleTime: selectedCategory ? 0 : 5 * 60 * 1000, // No cache when category is selected, 5 minutes otherwise
    refetchOnMount: selectedCategory ? true : false, // Always refetch when category is selected
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

export function useSearchOpportunitiesQuery(query: string, filters: any) {
  return useQuery({
    queryKey: queryKeys.search(query, filters || {}),
    queryFn: async () => {
      const response = await opportunitiesAPI.search(query, filters || {});
      const items = response.data?.opportunities || response.opportunities || [];
      return Array.isArray(items) ? items : [];
    },
    enabled: Boolean(query && query.trim()),
    staleTime: 10 * 60 * 1000,
  });
}


