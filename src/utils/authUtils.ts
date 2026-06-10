// Utility functions for authentication troubleshooting

/**
 * Clears all authentication-related data from localStorage
 * Useful when session corruption occurs
 */
export const clearAuthSession = () => {
  try {
    // Clear Supabase session data
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-khxyusmbfpgoftrnbmyk-auth-token');
    
    // Clear any other potential auth keys
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    
    // Reload the page to reinitialize
    window.location.reload();
  } catch (error) {
    console.error('Error clearing auth session:', error);
  }
};

/**
 * Debug function to check current auth state - for development only
 */
export const debugAuthState = () => {
  if (process.env.NODE_ENV === 'development') {
    const authKeys = Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('supabase'));
    
    authKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        console.log(`Auth Debug - ${key}:`, value ? JSON.parse(value) : value);
      } catch {
        console.log(`Auth Debug - ${key}:`, localStorage.getItem(key));
      }
    });
  }
};