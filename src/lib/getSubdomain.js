// lib/getSubdomain.js
export function getSubdomain() {
  if (typeof window === 'undefined') return null; // Server-side rendering guard
  
  const host = window.location.hostname; // e.g., client1.rjdh.app
  const parts = host.split(".");
  if (parts.length > 2) {
    return parts[0]; // "client1"
  }
  return null; // no subdomain
}