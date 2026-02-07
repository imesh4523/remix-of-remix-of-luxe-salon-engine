import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Province {
  id: string;
  name_en: string;
  name_si: string;
  code: string;
  created_at: string;
}

export interface District {
  id: string;
  province_id: string;
  name_en: string;
  name_si: string;
  code: string;
  created_at: string;
}

export interface Town {
  id: string;
  district_id: string;
  name_en: string;
  name_si: string;
  postal_code: string | null;
  created_at: string;
}

// Fetch all provinces
export const useProvinces = () => {
  return useQuery({
    queryKey: ['provinces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provinces')
        .select('*')
        .order('name_en');
      
      if (error) throw error;
      return data as Province[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour - location data rarely changes
  });
};

// Fetch districts by province
export const useDistricts = (provinceId: string | null) => {
  return useQuery({
    queryKey: ['districts', provinceId],
    queryFn: async () => {
      if (!provinceId) return [];
      
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .eq('province_id', provinceId)
        .order('name_en');
      
      if (error) throw error;
      return data as District[];
    },
    enabled: !!provinceId,
    staleTime: 1000 * 60 * 60,
  });
};

// Fetch all districts (for filtering when province changes)
export const useAllDistricts = () => {
  return useQuery({
    queryKey: ['districts', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .order('name_en');
      
      if (error) throw error;
      return data as District[];
    },
    staleTime: 1000 * 60 * 60,
  });
};

// Fetch towns by district
export const useTowns = (districtId: string | null) => {
  return useQuery({
    queryKey: ['towns', districtId],
    queryFn: async () => {
      if (!districtId) return [];
      
      const { data, error } = await supabase
        .from('towns')
        .select('*')
        .eq('district_id', districtId)
        .order('name_en');
      
      if (error) throw error;
      return data as Town[];
    },
    enabled: !!districtId,
    staleTime: 1000 * 60 * 60,
  });
};

// Fetch all towns (for filtering when district changes)
export const useAllTowns = () => {
  return useQuery({
    queryKey: ['towns', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('towns')
        .select('*')
        .order('name_en');
      
      if (error) throw error;
      return data as Town[];
    },
    staleTime: 1000 * 60 * 60,
  });
};

// Helper to get location display name
export const getLocationDisplayName = (
  town?: Town | null,
  district?: District | null,
  province?: Province | null
): string => {
  const parts: string[] = [];
  if (town) parts.push(town.name_en);
  if (district) parts.push(district.name_en);
  if (parts.length === 0 && province) parts.push(province.name_en);
  return parts.join(', ');
};
