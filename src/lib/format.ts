/**
 * Currency formatting utilities for Sri Lankan Rupees
 */

export const formatCurrency = (amount: number): string => {
  return `Rs ${amount.toLocaleString('en-LK')}`;
};

export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `Rs ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `Rs ${(amount / 1000).toFixed(1)}K`;
  }
  return `Rs ${amount.toLocaleString('en-LK')}`;
};

/**
 * Duration formatting utilities
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
};

/**
 * Estimate travel duration based on distance (rough estimate)
 * Assumes average speed of 30 km/h in urban Sri Lanka
 */
export const estimateTravelDuration = (distanceKm: number): string => {
  const averageSpeedKmh = 30; // km/h
  const durationHours = distanceKm / averageSpeedKmh;
  const durationMinutes = Math.round(durationHours * 60);
  
  if (durationMinutes < 1) {
    return '< 1 min';
  }
  if (durationMinutes < 60) {
    return `~${durationMinutes} min`;
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (minutes === 0) {
    return `~${hours} hr`;
  }
  return `~${hours} hr ${minutes} min`;
};

/**
 * Format travel duration from minutes (for use with route API response)
 */
export const formatTravelDuration = (minutes: number): string => {
  if (minutes < 1) {
    return '< 1 min';
  }
  if (minutes < 60) {
    return `~${Math.round(minutes)} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `~${hours} hr`;
  }
  return `~${hours} hr ${remainingMinutes} min`;
};
