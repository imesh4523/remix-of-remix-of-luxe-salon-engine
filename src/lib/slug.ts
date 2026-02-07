import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a URL-safe slug from a name string
 * @param name - The name to convert to a slug
 * @returns URL-safe slug string
 * 
 * Examples:
 * - "Luxe Beauty Studio" → "luxe-beauty-studio"
 * - "The Cutting Edge" → "the-cutting-edge"
 * - "Glow & Glamour" → "glow-glamour"
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    // Remove special characters except spaces and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove duplicate hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Trim to reasonable length
    .substring(0, 100);
};

/**
 * Validates if a string is a valid slug format
 * @param slug - The string to validate
 * @returns boolean indicating if it's a valid slug
 */
export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
};

/**
 * Generates a unique slug by checking the database for existing slugs
 * If slug exists, appends -2, -3, etc. until unique
 * @param name - The name to convert to a slug
 * @param excludeId - Optional salon ID to exclude from check (for updates)
 * @returns Promise<string> - Unique slug
 */
export const generateUniqueSlug = async (name: string, excludeId?: string): Promise<string> => {
  const baseSlug = generateSlug(name);
  
  // Check if base slug exists
  let query = supabase
    .from('salons')
    .select('slug')
    .eq('slug', baseSlug);
    
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  
  const { data: existing } = await query.maybeSingle();
  
  if (!existing) {
    return baseSlug;
  }
  
  // Slug exists, find a unique one by appending numbers
  let counter = 2;
  while (counter <= 100) { // Safety limit
    const newSlug = `${baseSlug}-${counter}`;
    
    let checkQuery = supabase
      .from('salons')
      .select('slug')
      .eq('slug', newSlug);
      
    if (excludeId) {
      checkQuery = checkQuery.neq('id', excludeId);
    }
    
    const { data: existingNew } = await checkQuery.maybeSingle();
    
    if (!existingNew) {
      return newSlug;
    }
    
    counter++;
  }
  
  // Fallback: add timestamp
  return `${baseSlug}-${Date.now()}`;
};
