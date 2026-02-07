import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type UserRole = 'customer' | 'vendor' | 'admin';

// Rate limiting constants
const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_KEY = 'auth_rate_limit';

interface RateLimitData {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const getRateLimitData = (): RateLimitData => {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { attempts: 0, firstAttemptAt: 0, lockedUntil: null };
};

const setRateLimitData = (data: RateLimitData) => {
  sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
};

const checkRateLimit = (): { allowed: boolean; remainingSeconds?: number } => {
  const data = getRateLimitData();
  const now = Date.now();

  // Check if locked out
  if (data.lockedUntil && now < data.lockedUntil) {
    return { allowed: false, remainingSeconds: Math.ceil((data.lockedUntil - now) / 1000) };
  }

  // Reset if lockout expired or window passed
  if (data.lockedUntil && now >= data.lockedUntil) {
    setRateLimitData({ attempts: 0, firstAttemptAt: 0, lockedUntil: null });
    return { allowed: true };
  }

  // Reset window if first attempt was more than lockout duration ago
  if (data.firstAttemptAt && now - data.firstAttemptAt > LOCKOUT_DURATION_MS) {
    setRateLimitData({ attempts: 0, firstAttemptAt: 0, lockedUntil: null });
    return { allowed: true };
  }

  return { allowed: true };
};

const recordFailedAttempt = () => {
  const data = getRateLimitData();
  const now = Date.now();

  const newData: RateLimitData = {
    attempts: data.attempts + 1,
    firstAttemptAt: data.firstAttemptAt || now,
    lockedUntil: null,
  };

  if (newData.attempts >= MAX_LOGIN_ATTEMPTS) {
    newData.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  setRateLimitData(newData);
  return newData;
};

const resetRateLimit = () => {
  sessionStorage.removeItem(RATE_LIMIT_KEY);
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
  } | null;
  roles: UserRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isVendor: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, phone')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      setRoles(data?.map(r => r.role as UserRole) || ['customer']);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles(['customer']);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          Promise.all([
            fetchProfile(session.user.id),
            fetchRoles(session.user.id)
          ]).catch(console.error);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          Promise.all([
            fetchProfile(session.user.id),
            fetchRoles(session.user.id)
          ]).catch(console.error);
        } else {
          setProfile(null);
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check rate limit before attempting
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.remainingSeconds || 0) / 60);
      const errorMsg = `Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const result = recordFailedAttempt();
      if (result.lockedUntil) {
        toast.error(`Account locked for 15 minutes due to too many failed attempts.`);
      } else {
        const remaining = MAX_LOGIN_ATTEMPTS - result.attempts;
        toast.error(`${error.message} (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)`);
      }
      throw error;
    }
    
    // Reset rate limit on successful login
    resetRateLimit();
    toast.success('Welcome back!');
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        full_name: fullName,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'customer',
      });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }
    }

    toast.success('Account created! Please check your email to verify.');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success('Signed out successfully');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success('Password reset email sent!');
  };

  const hasRole = (role: UserRole) => roles.includes(role);
  const isVendor = hasRole('vendor') || hasRole('admin');
  const isAdmin = hasRole('admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        hasRole,
        isVendor,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected route component
export const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: ReactNode; 
  requiredRole?: UserRole 
}) => {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && user && requiredRole && !hasRole(requiredRole)) {
      toast.error('You do not have permission to access this page');
      navigate('/');
    }
  }, [user, loading, requiredRole, hasRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && !hasRole(requiredRole)) return null;

  return <>{children}</>;
};
