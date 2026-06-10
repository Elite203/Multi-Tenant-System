/**
 * Utility functions for handling employee address formatting
 */

export interface AddressComponents {
  street_address?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
}

/**
 * Format split address components into a single formatted address string
 */
export const formatAddress = (address: AddressComponents): string => {
  const parts: string[] = [];
  
  if (address.street_address) {
    parts.push(address.street_address);
  }
  
  if (address.address_line_2) {
    parts.push(address.address_line_2);
  }
  
  // Combine city, state, and postal code on the same line
  const cityStatePostal: string[] = [];
  if (address.city) cityStatePostal.push(address.city);
  if (address.state_province) cityStatePostal.push(address.state_province);
  if (address.postal_code) cityStatePostal.push(address.postal_code);
  
  if (cityStatePostal.length > 0) {
    parts.push(cityStatePostal.join(', '));
  }
  
  return parts.join('\n');
};

/**
 * Check if any address components are provided
 */
export const hasAddress = (address: AddressComponents): boolean => {
  return !!(
    address.street_address ||
    address.address_line_2 ||
    address.city ||
    address.state_province ||
    address.postal_code
  );
};

/**
 * Format address for single line display (comma separated)
 */
export const formatAddressInline = (address: AddressComponents): string => {
  const parts: string[] = [];
  
  if (address.street_address) {
    parts.push(address.street_address);
  }
  
  if (address.address_line_2) {
    parts.push(address.address_line_2);
  }
  
  if (address.city) {
    parts.push(address.city);
  }
  
  if (address.state_province) {
    parts.push(address.state_province);
  }
  
  if (address.postal_code) {
    parts.push(address.postal_code);
  }
  
  return parts.join(', ');
};