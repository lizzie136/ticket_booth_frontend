import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { StoredAuthState, getStoredAuth, AUTH_STORAGE_KEY } from "../utils/auth";

export const Navigation =() => {
    const [authState, setAuthState] = useState<StoredAuthState | null>(() => getStoredAuth());
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
  
    // Listen for auth changes across tabs/windows
    // Small self-contained effect, does not require import of useEffect at this point
    if (typeof window !== 'undefined') {
      window.onstorage = (event: StorageEvent) => {
        if (event.key === AUTH_STORAGE_KEY) {
          setAuthState(getStoredAuth());
        }
      };
    }
  
    const handleLogout = () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthState(null);
      setMenuOpen(false);
      navigate('/');
    };
  
    if (authState && authState.user) {
      return (
        <nav className="flex items-center gap-4">
          {/* Hamburger menu */}
          <div className="relative">
            <button
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-700 hover:bg-gray-100 focus:outline-none"
              aria-label="Open menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {/* Hamburger icon */}
              <svg width="24" height="24" fill="none" aria-hidden="true">
                <rect x="4" y="6" width="16" height="2" rx="1" fill="currentColor" />
                <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
                <rect x="4" y="16" width="16" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-40">
                <div className="py-2 flex flex-col">
                  <span className="px-4 py-2 text-sm text-gray-900 font-semibold border-b">{authState.user.email}</span>
                  <Link
                    to="/"
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Events
                  </Link>
                  <Link
                    to="/orders"
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 w-full"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      );
    }
  
    return (
      <nav className="flex items-center gap-4">
        <Link
          to="/login"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Log In
        </Link>
        <Link
          to="/signup"
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          Sign Up
        </Link>
      </nav>
    );
  }