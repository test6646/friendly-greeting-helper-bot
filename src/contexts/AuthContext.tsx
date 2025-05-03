
import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";

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
  signOut: () => Promise<void>;
  loading: boolean;
  socket: Socket | null;
  connectSocket: () => void;
  disconnectSocket: () => void;
  isTestUser: boolean;
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => {},
  loading: true,
  socket: null,
  connectSocket: () => {},
  disconnectSocket: () => {},
  isTestUser: false,
  refreshUserProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTestUser, setIsTestUser] = useState(false);
  const { toast } = useToast();

  // Added function to manually refresh user profile
  const refreshUserProfile = async () => {
    console.log("Manually refreshing user profile");
    if (session?.user) {
      await fetchUserProfile(session.user);
    } else if (isTestUser) {
      // Try to refresh from local storage for test users
      const testModeUser = localStorage.getItem('test_mode_user');
      if (testModeUser) {
        try {
          const testUserData = JSON.parse(testModeUser);
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
        } catch (e) {
          console.error('Error refreshing test user:', e);
        }
      }
    }
  };

  useEffect(() => {
    // Check if we have a test mode user first
    const isTestMode = localStorage.getItem('auth_test_mode') === 'true';
    const testModeUser = localStorage.getItem('test_mode_user');
    
    if (isTestMode && testModeUser) {
      try {
        const testUserData = JSON.parse(testModeUser);
        
        // If we don't have a complete user profile, we need setup
        if (!testUserData.first_name || !testUserData.last_name || !testUserData.role) {
          console.log('Test user needs profile setup:', testUserData);
          setLoading(false);
          return;
        }
        
        // Set the user profile with test data
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
        
        // Create a simplified mock session for test user
        const mockSession = {
          access_token: `test-token-${Date.now()}`,
          refresh_token: `test-refresh-${Date.now()}`,
          user: {
            ...testUserData,
            id: testUserData.id
          },
          expires_at: Date.now() + 3600000 // 1 hour expiry
        } as unknown as Session;
        
        setSession(mockSession);
        setLoading(false);
        console.log('Test user initialized:', testProfile);
        
        // Skip the rest of the auth checks if we're in test mode
        return () => {};
      } catch (e) {
        console.error('Error parsing test user:', e);
        // If test user is invalid, clear it and continue with normal auth flow
        localStorage.removeItem('test_mode_user');
        setIsTestUser(false);
      }
    }
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state change event:", event);
        
        setSession(currentSession);
        
        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Use setTimeout to prevent potential auth deadlock
          setTimeout(() => {
            fetchUserProfile(currentSession.user);
            initializeSocket(currentSession.user.id);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          if (socket) {
            socket.disconnect();
            setSocket(null);
          }
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          // Token refreshed, update user if needed
          setTimeout(() => {
            if (currentSession.user && !user) {
              fetchUserProfile(currentSession.user);
            }
          }, 0);
        }
      }
    );

    // THEN check for existing session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("Initial session check:", initialSession ? "Found session" : "No session");
        
        setSession(initialSession);
        
        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user);
          initializeSocket(initialSession.user.id);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      console.log("Fetching user profile for:", authUser.id);
      
      // Check if the ID appears to be a test ID (from test mode)
      if (authUser.id.startsWith('test-')) {
        console.log("Detected test user ID, using local storage data");
        setIsTestUser(true);
        
        // Get test user data from localStorage
        const testModeUser = localStorage.getItem('test_mode_user');
        if (testModeUser) {
          const testUserData = JSON.parse(testModeUser);
          
          // If we don't have a complete user profile, we should redirect to setup
          if (!testUserData.first_name || !testUserData.last_name || !testUserData.role) {
            console.log('Test user needs profile setup:', testUserData);
            setUser(null);
            return;
          }
          
          // Set the user profile with test data
          const testProfile: UserProfile = {
            id: testUserData.id,
            first_name: testUserData.first_name,
            last_name: testUserData.last_name,
            phone: testUserData.phone || '+910000000000',
            role: testUserData.role,
            gender: testUserData.gender || 'prefer_not_to_say',
            profile_image_url: testUserData.profile_image_url,
          };
          
          setUser(testProfile);
        }
        return;
      }
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        
        // If no profile exists, create one based on metadata
        if (error.code === 'PGRST116') {
          try {
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: authUser.id,
                first_name: authUser.user_metadata.first_name || null,
                last_name: authUser.user_metadata.last_name || null,
                role: authUser.user_metadata.role || null,
                phone: authUser.phone
              })
              .select('*')
              .single();
              
            if (insertError) {
              console.error("Error creating profile:", insertError);
              throw insertError;
            }
            
            if (newProfile) {
              console.log("Created new profile:", newProfile);
              
              // Get phone from auth user's phone identity or data
              const phone = authUser.phone || newProfile.phone || '';
              
              // If the profile doesn't have complete data, redirect to setup
              if (!newProfile.first_name || !newProfile.last_name || !newProfile.role) {
                console.log("Profile needs setup:", newProfile);
                setUser(null);
                return;
              }
              
              setUser({
                id: authUser.id,
                first_name: newProfile.first_name,
                last_name: newProfile.last_name,
                phone: phone,
                ...(authUser.email ? { email: authUser.email } : {}),
                role: newProfile.role,
                gender: newProfile.gender,
                profile_image_url: newProfile.profile_image_url,
              });
              
              return;
            }
          } catch (e) {
            console.error("Failed to create profile:", e);
          }
        } else {
          throw error;
        }
      }

      if (data) {
        console.log("Profile data loaded:", data);
        // Get phone from auth user's phone identity or data
        const phone = authUser.phone || data.phone || '';
        
        // If the profile doesn't have complete data, redirect to setup
        if (!data.first_name || !data.last_name || !data.role ||
            (data.first_name === 'New' && data.last_name === 'User')) {
          console.log("Profile needs setup:", data);
          setUser(null);
          return;
        }
        
        setUser({
          id: authUser.id,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: phone,
          // Only include email if it exists in auth user data
          ...(authUser.email ? { email: authUser.email } : {}),
          role: data.role,
          gender: data.gender,
          profile_image_url: data.profile_image_url,
        });

        console.log("User role set to:", data.role);
      } else {
        console.log("No profile found for user");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const initializeSocket = (userId: string) => {
    try {
      // Skip socket initialization for test users
      if (userId.startsWith('test-')) {
        console.log("Test user detected, skipping socket initialization");
        return;
      }
      
      // Create socket connection with auto-connect set to false (we'll connect when needed)
      const socketInstance = io("https://api.shekatiffin.com", {
        auth: {
          token: `user_${userId}`,
        },
        autoConnect: false, // Don't connect automatically
      });

      // Add socket event listeners
      socketInstance.on("connect", () => {
        console.log("Socket connected");
        toast({
          title: "Connected",
          description: "You are now connected to real-time notifications",
        });
      });

      socketInstance.on("notification", (data) => {
        toast({
          title: data.title || "New Notification",
          description: data.message,
          variant: "default",
        });
      });

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        toast({
          title: "Connection Error",
          description: "Could not connect to notification service",
          variant: "destructive",
        });
      });

      setSocket(socketInstance);
    } catch (error) {
      console.error("Error initializing socket:", error);
    }
  };

  const connectSocket = () => {
    if (socket && !socket.connected) {
      socket.connect();
      console.log("Socket connection initiated");
    }
  };

  const disconnectSocket = () => {
    if (socket && socket.connected) {
      socket.disconnect();
      console.log("Socket disconnected");
    }
  };

  const signOut = async () => {
    try {
      // Check if we're in test mode
      const isTestMode = localStorage.getItem('auth_test_mode') === 'true';
      
      if (isTestMode) {
        // Just clear the test user from local storage
        localStorage.removeItem('test_mode_user');
        setUser(null);
        setSession(null);
        setIsTestUser(false);
        if (socket) {
          socket.disconnect();
          setSocket(null);
        }
        toast({
          title: "Logged out",
          description: "You have been successfully logged out from test mode.",
        });
        return;
      }
      
      // Normal sign out for non-test mode
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsTestUser(false);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      signOut, 
      loading, 
      socket, 
      connectSocket,
      disconnectSocket,
      isTestUser,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
