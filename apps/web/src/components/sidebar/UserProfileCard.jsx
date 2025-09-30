import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function initialsFrom(nameOrEmail) {
  if (!nameOrEmail) return "U";
  const cleaned = nameOrEmail.replace(/@.*/, "");
  const parts = cleaned.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem("sla.user");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function UserProfileCard({ isAuthed: isAuthedProp, onLogin, onLogout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [storedUser] = useState(() => getStoredUser());
  const [storedAuthed] = useState(() => {
    const v = localStorage.getItem("sla.isAuthed");
    return v === "true";
  });

  const isAuthed =
    typeof isAuthedProp === "boolean" ? isAuthedProp : storedAuthed;

  const user = useMemo(() => {
    if (storedUser) return storedUser;
    return isAuthed
      ? { name: "User", email: "user@example.com" }
      : { name: "Guest", email: "Not signed in" };
  }, [storedUser, isAuthed]);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    window.addEventListener("popstate", close);
    return () => {
      window.removeEventListener("hashchange", close);
      window.removeEventListener("popstate", close);
    };
  }, []);

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
      return;
    }
    navigate("/?login=1");
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("sla.user");
      localStorage.setItem("sla.isAuthed", "false");
      navigate("/");
      setTimeout(() => window.location.reload(), 50);
    }
  };

  return (
    <div className="mt-auto px-3 pb-3">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-semibold">
            {initialsFrom(user.name || user.email)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {user.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </div>
          </div>
          <svg
            className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open && (
          <div
            role="menu"
            className="px-2 pb-2 pt-1 space-y-1 border-t border-gray-100 dark:border-gray-700"
          >
            <Link
              to="/app"
              className="block rounded-lg px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              role="menuitem"
            >
              Dashboard Home
            </Link>
            <Link
              to="/"
              className="block rounded-lg px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              role="menuitem"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="block rounded-lg px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              role="menuitem"
            >
              About
            </Link>
            <Link
              to="/help"
              className="block rounded-lg px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              role="menuitem"
            >
              Help
            </Link>

            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />

            {isAuthed ? (
              <button
                onClick={handleLogout}
                className="w-full text-left rounded-lg px-2 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                role="menuitem"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="w-full text-left rounded-lg px-2 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                role="menuitem"
              >
                Login
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}