import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Today from "./components/Today";
import Admin from "./components/Admin";
import Users from "./components/Users";
import Locations from "./components/Locations";
import Stats from "./components/Stats";
import Fuel from "./components/Fuel";
import "./index.css";

// Session timeout: 1 hour
const SESSION_TIMEOUT = 60 * 60 * 1000;

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState("worker");
  const [userName, setUserName] = useState("");
  const [currentPage, setCurrentPage] = useState("today");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Activity tracker
  useEffect(() => {
    const events = ["mousedown", "keypress", "scroll", "touchstart", "click"];
    const updateActivity = () => setLastActivity(Date.now());
    
    events.forEach(event => 
      document.addEventListener(event, updateActivity, { passive: true })
    );
    
    return () => 
      events.forEach(event => 
        document.removeEventListener(event, updateActivity)
      );
  }, []);

  // Session timeout checker
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      if (Date.now() - lastActivity >= SESSION_TIMEOUT) {
        handleLogout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session, lastActivity]);

  // Auth state management
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(currentSession);
          if (currentSession) {
            await loadUserProfile(currentSession.user.id);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          if (newSession) {
            await loadUserProfile(newSession.user.id);
          } else {
            setUserRole("worker");
            setUserName("");
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile
  const loadUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, name, email")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setUserRole(data.role || "worker");
        setUserName(data.name || data.email?.split("@")[0] || "Kasutaja");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }, []);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setCurrentPage("today");
      setUserRole("worker");
      setUserName("");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <svg className="spin" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p>Laen...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!session) {
    return <Login />;
  }

  // Main app
  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        userRole={userRole}
        onLogout={handleLogout}
        isMobile={isMobile}
        userName={userName}
      />
      <main className="main-content">
        {currentPage === "today" && (
          <Today session={session} userRole={userRole} onLogout={handleLogout} />
        )}
        {currentPage === "fuel" && (
          <Fuel session={session} userRole={userRole} />
        )}
        {currentPage === "admin" && userRole === "admin" && <Admin />}
        {currentPage === "stats" && userRole === "admin" && <Stats />}
        {currentPage === "users" && userRole === "admin" && <Users />}
        {currentPage === "locations" && userRole === "admin" && <Locations />}
      </main>
    </div>
  );
}
