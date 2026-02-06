import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  CloudIcon,
  ClockIcon,
  ShareIcon,
  ArrowRightOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  TableCellsIcon,
  ChartBarIcon,
  CircleStackIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuthContext } from "./context/AuthProvider";
import { toast } from "react-hot-toast";

const Sidebar = () => {
  const navigate = useNavigate();
  const { authUser, logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
  };

  return (
    <ul className="menu bg-[#026666] text-white rounded-r-3xl min-h-full w-72 space-y-3 overflow-y-auto scrollbar-hide z-60">
      {/* Logo Section */}
      <div className="mx-auto">
        <div className="flex flex-col items-center">
          <img src="/logo.png" className="w-16" alt="Logo" />
          <h1 className="font-bold text-lg">BRRI</h1>
        </div>
      </div>
      <hr className="border-gray-400" />

      {/* Menu Items */}
      <li className="text-base font-medium">
        <NavLink to="/forecast">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5"
          >
            <path d="M1 12.5A4.5 4.5 0 0 0 5.5 17H15a4 4 0 0 0 1.866-7.539 3.504 3.504 0 0 0-4.504-4.272A4.5 4.5 0 0 0 4.06 8.235 4.502 4.502 0 0 0 1 12.5Z" />
          </svg>
          Weather Forecast
        </NavLink>
      </li>

      <li className="text-base font-medium">
        <NavLink to="/aws">
          <CloudIcon className="w-5 h-5 mr-2" />
          AgWS
        </NavLink>
      </li>

      <li className="text-base font-medium">
        <NavLink to="/historical-data">
          <ClockIcon className="w-5 h-5 mr-2" />
          Historical Data
        </NavLink>
      </li>

      <li className="text-base font-medium">
        <NavLink to="/secondary-source">
          <ShareIcon className="w-5 h-5 mr-2" />
          Secondary Source
        </NavLink>
      </li>

      <li className="text-base font-medium">
        <NavLink to="/feedback">
          <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
          Feedback
        </NavLink>
      </li>

      <li className="text-base font-medium">
        <NavLink to="/about">
          <InformationCircleIcon className="w-5 h-5 mr-2" />
          About
        </NavLink>
      </li>

      {/* Admin Only Routes */}
      {authUser && authUser.role === "admin" && (
        <>
          <li className="text-base font-medium">
            <NavLink to="/cis">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              CIS Requests
            </NavLink>
          </li>

          <li className="text-base font-medium">
            <NavLink to="/add-data">
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Add Historical Data
            </NavLink>
          </li>

          <li className="text-base font-medium">
            <NavLink to="/view-data">
              <TableCellsIcon className="w-5 h-5 mr-2" />
              View Historical Data
            </NavLink>
          </li>

          <li className="text-base font-medium">
            <NavLink to="/dcrs-add-data">
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Add Rice Data
            </NavLink>
          </li>

          <li className="text-base font-medium">
            <NavLink to="/dcrs-view-data">
              <CircleStackIcon className="w-5 h-5 mr-2" />
              View Rice Data
            </NavLink>
          </li>

          <li className="text-base font-medium">
            <NavLink to="/data-access-requests">
              <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
              Data Access Requests
            </NavLink>
          </li>

          <li className="text-base font-medium">
            <NavLink to="/user-management">
              <UserGroupIcon className="w-5 h-5 mr-2" />
              User Management
            </NavLink>
          </li>

          <li className="text-base font-medium">
            <NavLink to="/feedback-management">
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
              Feedback Management
            </NavLink>
          </li>
        </>
      )}

      {/* Login/Logout */}
      {authUser && (
        <li>
          <button onClick={handleLogout} className="text-base font-medium">
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
            Log out
          </button>
        </li>
      )}
    </ul>
  );
};

export default Sidebar;
