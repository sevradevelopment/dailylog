import { useState } from "react";

// Modern Icons
const Icons = {
  Today: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" />
    </svg>
  ),
  Fuel: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 22V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13" />
      <path d="M15 7h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h0" />
      <line x1="3" y1="22" x2="17" y2="22" />
      <rect x="6" y="12" width="6" height="5" rx="1" />
      <path d="M19 10v6" strokeLinecap="round" />
    </svg>
  ),
  History: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  Stats: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Locations: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Logout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const ICON_PATHS = {
  tree: <path d="M12 2l2.09 4.26L19 7.27l-4 3.9 1.18 6.88L12 15.77l-4.18 2.28L9 11.17 5 7.27l4.91-.01L12 2z"/>,
};

const Ico = ({ name, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {ICON_PATHS[name]}
  </svg>
);

export default function Sidebar({
  currentPage,
  onNavigate,
  userRole,
  onLogout,
  isMobile,
  userName,
}) {
  const isAdmin = userRole === "admin";

  // Menu items configuration
  const workerItems = [
    { id: "today", label: "Täna", icon: Icons.Today },
    { id: "fuel", label: "Tankimine", icon: Icons.Fuel },
  ];

  const adminItems = [
    { id: "today", label: "Täna", icon: Icons.Today },
    { id: "fuel", label: "Tankimine", icon: Icons.Fuel },
    { id: "admin", label: "Ajalugu", icon: Icons.History },
    { id: "stats", label: "Statistika", icon: Icons.Stats },
    { id: "users", label: "Kasutajad", icon: Icons.Users },
    { id: "locations", label: "Asukohad", icon: Icons.Locations },
  ];

  const menuItems = isAdmin ? adminItems : workerItems;

  // Mobile navigation items (shortened labels)
  const mobileItems = isAdmin
    ? [
        { id: "today", label: "Täna", icon: Icons.Today },
        { id: "fuel", label: "Tank", icon: Icons.Fuel },
        { id: "admin", label: "Ajalugu", icon: Icons.History },
        { id: "stats", label: "Stats", icon: Icons.Stats },
        { id: "users", label: "Users", icon: Icons.Users },
      ]
    : workerItems;

  // Mobile view
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <header className="mobile-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
              }}
            >
              🌲
            </div>
            <h3>Tööpäevik</h3>
          </div>
          <span
            style={{
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.5)",
              fontWeight: "600",
            }}
          >
            {userName}
          </span>
        </header>

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`bottom-nav-item ${
                  currentPage === item.id ? "active" : ""
                }`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}
          <button className="bottom-nav-item" onClick={onLogout}>
            <Icons.Logout />
            Välja
          </button>
        </nav>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <h2>
          <span style={{ fontSize: "1.5rem" }}><Ico name="tree" size={24} /></span> Tööpäevik
        </h2>
        {userName && (
          <p>
            Tere, <strong style={{ color: "rgba(255,255,255,0.7)" }}>{userName}</strong>
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${
                currentPage === item.id ? "active" : ""
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className="sidebar-item"
          onClick={onLogout}
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <Icons.Logout />
          Logi välja
        </button>
      </div>
    </aside>
  );
}
