import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  CloudIcon,
  ClockIcon,
  ShareIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  TableCellsIcon,
  CircleStackIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { AlertTriangle } from "lucide-react";
import { useAuthContext } from "./context/AuthProvider";
import { UPLOADS_BASE_URL } from "../config/api";
import { toast } from "react-hot-toast";

const SidebarLink = ({ to, icon: Icon, label, onClick, isButton }) => {
  const baseClasses =
    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative";

  if (isButton) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} w-full text-teal-100/80 hover:text-white hover:bg-white/10`}
      >
        <Icon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${baseClasses} ${
          isActive
            ? "bg-white/15 text-white shadow-lg shadow-black/10 backdrop-blur-sm border border-white/10"
            : "text-teal-100/80 hover:text-white hover:bg-white/8"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full" />
          )}
          <Icon
            className={`w-5 h-5 shrink-0 transition-all duration-200 ${
              isActive ? "text-emerald-400" : "group-hover:scale-110"
            }`}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser, logout } = useAuthContext();
  const [adminOpen, setAdminOpen] = useState(true);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
  };

  const isAdmin = authUser && authUser.role === "admin";

  const adminRoutes = [
    "/cis",
    "/add-data",
    "/view-data",
    "/dcrs-add-data",
    "/dcrs-view-data",
    "/user-management",
    "/feedback-management",
  ];
  const isAdminRouteActive = adminRoutes.some((r) =>
    location.pathname.startsWith(r),
  );

  return (
    <aside className="flex flex-col bg-linear-to-b from-[#0a3d3d] via-[#0d4a4a] to-[#083535] text-white h-full min-h-screen lg:min-h-full w-72 select-none">
      {/* Logo Section */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-lg">
            <img src="/logo.png" className="w-8 h-8" alt="Logo" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide leading-tight">
              Agromet Services
            </h1>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-linear-to-r from-transparent via-teal-400/30 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        <p className="px-4 pb-1 pt-1 text-[10px] font-semibold text-teal-400/50 uppercase tracking-[0.15em]">
          Main Menu
        </p>

        <SidebarLink
          to="/weather-forecast"
          icon={CloudIcon}
          label="Weather Forecast"
        />
        <SidebarLink
          to="/weather-alert"
          icon={AlertTriangle}
          label="Weather Alert"
        />
        <SidebarLink
          to="/aws"
          icon={ClockIcon}
          label="Real time Weather Data"
        />
        <SidebarLink
          to="/historical-data"
          icon={TableCellsIcon}
          label="Historical Weather Data"
        />
        <SidebarLink
          to="/secondary-source"
          icon={ShareIcon}
          label="Rice & Rice Related Data"
        />
        <SidebarLink
          to="/feedback"
          icon={ChatBubbleLeftRightIcon}
          label="Feedback"
        />
        <SidebarLink to="/about" icon={InformationCircleIcon} label="About" />

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="pt-3" />
            <div className="mx-1 h-px bg-linear-to-r from-transparent via-teal-400/20 to-transparent" />
            <div className="pt-2" />

            <button
              onClick={() => setAdminOpen((prev) => !prev)}
              className={`flex items-center justify-between w-full px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-200 ${
                isAdminRouteActive
                  ? "text-emerald-400/80"
                  : "text-teal-400/50 hover:text-teal-300/70"
              }`}
            >
              <span className="flex items-center gap-2">
                <Cog6ToothIcon className="w-3.5 h-3.5" />
                Administration
              </span>
              <ChevronDownIcon
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  adminOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                adminOpen ? "max-h-125 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <SidebarLink
                to="/cis"
                icon={DocumentTextIcon}
                label="CIS Requests"
              />
              <SidebarLink
                to="/add-data"
                icon={PlusCircleIcon}
                label="Add Historical Data"
              />
              <SidebarLink
                to="/view-data"
                icon={TableCellsIcon}
                label="View Historical Data"
              />
              <SidebarLink
                to="/dcrs-add-data"
                icon={PlusCircleIcon}
                label="Add Rice Data"
              />
              <SidebarLink
                to="/dcrs-view-data"
                icon={CircleStackIcon}
                label="View Rice Data"
              />
              <SidebarLink
                to="/user-management"
                icon={UserGroupIcon}
                label="User Management"
              />
              <SidebarLink
                to="/feedback-management"
                icon={ChatBubbleLeftRightIcon}
                label="Feedback Management"
              />
            </div>
          </>
        )}
      </nav>

      {/* Farmer Service Image Section - Only for non-admin users */}
      {authUser && authUser.role !== "admin" && (
        <div className="">
          <div className="relative">
            <div className="relative overflow-hidden">
              <img
                src="/farmerService2.png"
                alt="Farmer Services"
                className="w-full h-auto object-contain"
                style={{ maxHeight: "400px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section — User + Logout */}
      <div className="mt-auto border-t border-white/8">
        {authUser && (
          <div className="px-4 py-4">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 mb-2 px-2 py-2 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-white/15 shadow-lg shadow-black/10 backdrop-blur-sm border border-white/10"
                    : "hover:bg-white/8"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="w-9 h-9 rounded-full overflow-hidden shadow-lg shadow-emerald-500/20 shrink-0">
                    {authUser.profilePicture ? (
                      <img
                        src={`${UPLOADS_BASE_URL}/${authUser.profilePicture}`}
                        alt={authUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-sm font-bold text-white">
                        {authUser.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {authUser.name || "User"}
                    </p>
                    <p className="text-[11px] text-teal-300/50 truncate">
                      {authUser.role === "admin" ? "Administrator" : "User"}
                    </p>
                  </div>
                  <UserCircleIcon
                    className={`w-4.5 h-4.5 shrink-0 transition-all duration-200 ${
                      isActive
                        ? "text-emerald-400"
                        : "text-teal-300/40 group-hover:text-teal-200/70"
                    }`}
                  />
                </>
              )}
            </NavLink>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-300/80 hover:text-red-200 hover:bg-red-500/10 transition-all duration-200 group"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
