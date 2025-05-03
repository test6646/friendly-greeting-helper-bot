import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  role: string;
  gender?: string;
  profile_image_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isTestUser: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const SimpleAuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isTestUser: false,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTestUser, setIsTestUser] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  // Function to refresh user profile data
  const refreshUser = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshing) {
      console.log("Already refreshing user profile, skipping duplicate call");
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      console.log("Refreshing user profile...");
      
      // Check for test user first
      const isTestMode = localStorage.getItem('auth_test_mode') === 'true';
      const testModeUser = localStorage.getItem('test_mode_user');
      
      if (isTestMode && testModeUser) {
        try {
          const testUserData = JSON.parse(testModeUser);
          
          // Create user profile from test data
          const testProfile: UserProfile = {
            id: testUserData.id,
            first_name: testUserData.first_name || 'Test',
            last_name: testUserData.last_name || 'User',
            phone: testUserData.phone || '+910000000000',
            role: testUserData.role || 'customer',
            gender: testUserData.gender || 'prefer_not_to_say',
            profile_image_url: testUserData.profile_image_url,
          };
          
          setUser(testProfile);
          setIsTestUser(true);
          console.log('Test user refreshed:', testProfile);
          return;
        } catch (e) {
          console.error('Error refreshing test user:', e);
          localStorage.removeItem('test_mode_user');
        }
      }
      
      // For regular users, get current session and fetch profile
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentSession.user.id)
          .single();
          
        if (error) {
          console.error("Error fetching user profile:", error);
          // Don't clear user state on error, keep existing state
          return;
        }
        
        if (profile) {
          const userProfile: UserProfile = {
            id: currentSession.user.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone: currentSession.user.phone || profile.phone || '',
            ...(currentSession.user.email ? { email: currentSession.user.email } : {}),
            role: profile.role,
            gender: profile.gender,
            profile_image_url: profile.profile_image_url,
          };
          
          setUser(userProfile);
          setSession(currentSession);
          console.log('User profile refreshed:', userProfile);
        }
      } else {
        console.log("No active session found during refresh");
        // Only clear user if we know there's no session
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error("Error in refreshUser:", error);
      // Don't clear user state on error
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [isRefreshing]);
  
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state change event:", event);
        
        if (currentSession) {
          setSession(currentSession);
          
          // Check if we're dealing with a test user
          const isTestMode = localStorage.getItem('auth_test_mode') === 'true';
          
          if (isTestMode && currentSession.user.id.startsWith('test-')) {
            setIsTestUser(true);
            console.log("Test user session detected");
          } else {
            setIsTestUser(false);
          }
          
          // Fetch user profile if signed in
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Set timeout to prevent potential auth deadlock
            setTimeout(() => {
              refreshUser();
            }, 0);
          }
        } else {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    );

    // Initial session check
    const checkInitialSession = async () => {
      try {
        console.log("Checking initial session...");
        
        // Check for test user first
        const isTestMode = localStorage.getItem('auth_test_mode') === 'true';
        const testModeUser = localStorage.getItem('test_mode_user');
        
        if (isTestMode && testModeUser) {
          try {
            const testUserData = JSON.parse(testModeUser);
            
            // Create user profile from test data
            const testProfile: UserProfile = {
              id: testUserData.id,
              first_name: testUserData.first_name || 'Test',
              last_name: testUserData.last_name || 'User',
              phone: testUserData.phone || '+910000000000',
              role: testUserData.role || 'customer',
              gender: testUserData.gender || 'prefer_not_to_say',
              profile_image_url: testUserData.profile_image_url,
            };
            
            setUser(testProfile);
            setIsTestUser(true);
            
            // Create a mock session
            const mockSession = {
              access_token: `test-token-${Date.now()}`,
              refresh_token: `test-refresh-${Date.now()}`,
              user: testUserData,
              expires_at: Date.now() + 3600000
            } as unknown as Session;
            
            setSession(mockSession);
            console.log('Test user initialized:', testProfile);
          } catch (e) {
            console.error('Error parsing test user:', e);
            localStorage.removeItem('test_mode_user');
          } finally {
            setLoading(false);
          }
        } else {
          // For regular users
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          
          if (initialSession?.user) {
            setSession(initialSession);
            
            // Fetch user profile
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", initialSession.user.id)
              .single();
              
            if (!error && profile) {
              const userProfile: UserProfile = {
                id: initialSession.user.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: initialSession.user.phone || profile.phone || '',
                ...(initialSession.user.email ? { email: initialSession.user.email } : {}),
                role: profile.role,
                gender: profile.gender,
                profile_image_url: profile.profile_image_url,
              };
              
              setUser(userProfile);
              console.log('User profile loaded:', userProfile);
            } else {
              console.log("No profile found or error:", error);
              // Keep loading state true if profile not found
              setLoading(false);
            }
          } else {
            console.log("No initial session found");
            setUser(null);
            setSession(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error checking initial session:", error);
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Check if we're in test mode
      if (isTestUser) {
        localStorage.removeItem('test_mode_user');
        setUser(null);
        setSession(null);
        setIsTestUser(false);
        
        toast({
          title: "Logged out",
          description: "You have been logged out from test mode",
        });
        
        setLoading(false);
        return;
      }
      
      // Regular signout
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimpleAuthContext.Provider
      value={{
        user,
        session,
        loading,
        isTestUser,
        signOut,
        refreshUser
      }}
    >
      {children}
    </SimpleAuthContext.Provider>
  );
};

export const useSimpleAuth = () => useContext(SimpleAuthContext);
