import { useEffect, useState } from "react";
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

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState("worker");
  const [userName, setUserName] = useState("");
  const [currentPage, setCurrentPage] = useState("today");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const events = ["mousedown", "keypress", "scroll", "touchstart", "click"];
    const update = () => setLastActivity(Date.now());
    events.forEach(e => document.addEventListener(e, update, true));
    return () => events.forEach(e => document.removeEventListener(e, update, true));
  }, []);

  useEffect(() => {
    if (!session) return;
    const check = setInterval(() => {
      if (Date.now() - lastActivity >= 60 * 60 * 1000) { handleLogout(); clearInterval(check); }
    }, 60000);
    return () => clearInterval(check);
  }, [session, lastActivity]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadUserProfile(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadUserProfile(s.user.id);
      else { setUserRole("worker"); setUserName(""); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId) {
    const { data } = await supabase.from("profiles").select("role, name, email").eq("id", userId).single();
    if (data) {
      setUserRole(data.role || "worker");
      setUserName(data.name || data.email?.split("@")[0] || "");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentPage("today");
  }

  if (!session) return <Login />;

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
        {currentPage === "today" && <Today session={session} userRole={userRole} onLogout={handleLogout} />}
        {currentPage === "fuel" && <Fuel session={session} userRole={userRole} />}
        {currentPage === "admin" && userRole === "admin" && <Admin />}
        {currentPage === "stats" && userRole === "admin" && <Stats />}
        {currentPage === "users" && userRole === "admin" && <Users />}
        {currentPage === "locations" && userRole === "admin" && <Locations />}
      </main>
    </div>
  );
}