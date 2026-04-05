import { useState, useEffect } from "react";
import { supabase } from "../features/auth/supabaseClient";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../routes/Navitems";
import logo from "../assets/layitalogosvg.svg";

interface UserProfile {
  name: string;
  role: string;
}

/**
 * Sidebar
 *
 * Props:
 * footer           – optional ReactNode rendered at the bottom (defaults to the user profile)
 * defaultCollapsed – boolean, default false
 */
export default function Sidebar({ footer = null, defaultCollapsed = false }) {

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function getProfile() {
      // 1. Get the current authenticated user's ID
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. Fetch the name and role from the 'profiles' table
        const { data, error } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', user.id)
          .single(); // We only expect one row

        if (!error && data) {
          setProfile(data);
        }
      }
    }
    getProfile();
  }, []); 

  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__top">
        <div className="sidebar__logo-area">
          <img src={logo} alt="Layita Logo" className="sidebar__logo" />
        </div>
        <button
          className="sidebar__collapse-btn"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            {collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      <nav className="sidebar__nav">
        <ul>
          {/* Note: If you want to add the "nav-section-label" (e.g., "Overview", "Programme") 
              like in the HTML, you will need to update your NAV_ITEMS array to include section 
              headers and map through them here. */}
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => (isActive ? "active" : "")}
                data-tooltip={label}
              >
                <span className="sidebar__nav-icon">{icon}</span>
                <span className="sidebar__nav-label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar__footer">
        {footer ? (
          footer
        ) : (
          <div className="sidebar__user">
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{profile?.name || "Admin User"}</div>
              <div className="sidebar__user-role">{profile?.role || "Administrator"}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}