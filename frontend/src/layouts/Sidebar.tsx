import { NavLink, useNavigate } from "react-router-dom";
import { Logout01Icon, ShieldUserIcon } from "hugeicons-react";
import { navItems } from "./navigation";
import { useAuth } from "../lib/auth-context";
import { hasRole } from "../lib/permissions";

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const visibleItems = navItems.filter(
    (item) => !item.roles || hasRole(user?.role, item.roles),
  );

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-semibold text-gray-900">Finzo</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {visibleItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              ].join(" ")
            }
          >
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}

        {user?.isSuperAdmin && (
          <NavLink
            to="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ShieldUserIcon size={20} strokeWidth={1.8} />
            <span>Platform Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <div className="mb-2 truncate px-3 text-xs text-gray-500">
          {user?.email}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <Logout01Icon size={20} strokeWidth={1.8} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
