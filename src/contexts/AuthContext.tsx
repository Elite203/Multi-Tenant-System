import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'hr' | 'manager' | 'employee' | 'director';
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  force_password_change: boolean;
}
interface TenantUserSession {
  user: {
    id: string;
    email: string;
  };
  session?: {
    access_token?: string;
    expires_at?: number;
    // add more if you want
  };
}

interface TenantUser {
  id: bigint;
  created_at: string;
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

type AuthAction = 
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; session: Session | null; user: User | null }
  | { type: 'PROFILE_SUCCESS'; profile: Profile | null }
  | { type: 'AUTH_ERROR' }
  | { type: 'AUTH_INITIALIZED' };

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  requiresPasswordChange: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        session: action.session,
        user: action.user,
        loading: false,
        initialized: true
      };
    case 'PROFILE_SUCCESS':
      return { ...state, profile: action.profile };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        session: null,
        profile: null,
        loading: false,
        initialized: true
      };
    case 'AUTH_INITIALIZED':
      return { ...state, loading: false, initialized: true };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  initialized: false
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getSubdomain = (): string => {
  const host = window.location.hostname;
  const parts = host.split('.');
  return parts[0];
};

const isTenantSubdomain = (subdomain: string): boolean => {
  return subdomain !== 'rjdh' && subdomain !== 'www' && subdomain !== 'localhost';
};

const getSupabaseClient = (subdomain: string) => {
  if (isTenantSubdomain(subdomain)) {
    const url = `https://${subdomain}.supabase.co`;
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoeHl1c21iZnBnb2Z0cm5ibXlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk4Njg2NiwiZXhwIjoyMDcyNTYyODY2fQ.XinEnpd8pbUN4-mLqkbSQXRP1MSijjYAvQtIRsu6b-U";
    return createClient(url, key);
  } else {
    return supabase;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { toast } = useToast();
  const initializationRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchUserProfile = async (userId: string, client: any) => {
    if (!mountedRef.current) return;

    try {
      const { data: profileData } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (mountedRef.current) {
        dispatch({ type: 'PROFILE_SUCCESS', profile: profileData });
      }
    } catch (error) {
      if (mountedRef.current) {
        dispatch({ type: 'PROFILE_SUCCESS', profile: null });
      }
    }
  };

 useEffect(() => {
  mountedRef.current = true;

  if (initializationRef.current) return;
  initializationRef.current = true;

  let authSubscription: any = null;

  const initializeAuth = async () => {
    const subdomain = getSubdomain();
    const client = getSupabaseClient(subdomain);

    // Always use Supabase auth
    try {
      const { data: { session }, error } = await client.auth.getSession();

      if (error) {
        if (
          error.message.includes('refresh_token_not_found') ||
          error.message.includes('Invalid Refresh Token')
        ) {
          await client.auth.signOut();
        }
        dispatch({ type: 'AUTH_ERROR' });
        return;
      }

      if (!mountedRef.current) return;

      dispatch({ type: 'AUTH_SUCCESS', session, user: session?.user ?? null });

      if (session?.user) {
        setTimeout(() => fetchUserProfile(session.user.id, client), 0);
      }

      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event, session) => {
          if (!mountedRef.current) return;

          if (event === 'TOKEN_REFRESHED' && !session) {
            await client.auth.signOut();
            dispatch({ type: 'AUTH_ERROR' });
            return;
          }

          if (event === 'SIGNED_OUT' || !session) {
            dispatch({ type: 'AUTH_SUCCESS', session: null, user: null });
            dispatch({ type: 'PROFILE_SUCCESS', profile: null });
          } else if (session?.user && session.user.id !== state.user?.id) {
            dispatch({ type: 'AUTH_SUCCESS', session, user: session.user });
            setTimeout(() => fetchUserProfile(session.user.id, client), 0);
          }
        }
      );

      authSubscription = subscription;
    } catch (error) {
      try {
        await client.auth.signOut();
      } catch (_) {}
      if (mountedRef.current) dispatch({ type: 'AUTH_ERROR' });
    }
  };

  initializeAuth();

  return () => {
    mountedRef.current = false;
    if (authSubscription) authSubscription.unsubscribe();
  };
}, []);


const signIn = async (email: string, password: string) => {
  const subdomain = getSubdomain();
  const client = getSupabaseClient(subdomain);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    toast({
      title: 'Sign In Failed',
      description: error.message,
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Welcome back!',
      description: 'You have successfully signed in.',
    });
  }
  return { error };
};


  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const subdomain = getSubdomain();

    if (isTenantSubdomain(subdomain)) {
      toast({
        title: "Sign Up Failed",
        description: "Sign up not available for tenant domains",
        variant: "destructive",
      });
      return { error: new Error('Sign up not available') };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    const subdomain = getSubdomain();
    const client = getSupabaseClient(subdomain);
    const { error } = await client.auth.signOut();
    if (!error) {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    }
    // Force sign out in app
    dispatch({ type: 'AUTH_SUCCESS', session: null, user: null });
    dispatch({ type: 'PROFILE_SUCCESS', profile: null });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const subdomain = getSubdomain();

    if (isTenantSubdomain(subdomain)) {
      toast({
        title: "Update Failed",
        description: "Profile update not available for tenant domains",
        variant: "destructive",
      });
      return { error: new Error('Profile update not available') };
    }

    if (!state.user) return { error: new Error('No user found') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id);

    if (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      dispatch({
        type: 'PROFILE_SUCCESS',
        profile: state.profile ? { ...state.profile, ...updates } : null
      });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    }

    return { error };
  };

  const value = {
    user: state.user,
    profile: state.profile,
    session: state.session,
    loading: state.loading,
    requiresPasswordChange: Boolean(state.profile?.force_password_change),
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useSupabaseClient = () => {
  const subdomain = getSubdomain();
  return getSupabaseClient(subdomain);
};