import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import WelcomeModal from "../components/WelcomeModal";
import WhatsAppButton from "../components/WhatsAppButton";

const DashboardLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const sidebarRef = useRef(null);

  // Show welcome modal every time user logs in
  useEffect(() => {
    setShowWelcomeModal(true);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-999 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on desktop, slide-over on mobile */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-1000 w-72 overflow-y-auto transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto lg:overflow-visible ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-900 bg-linear-to-r from-[#0a3d3d] via-[#0d5555] to-[#0a3d3d] shadow-md">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            {/* Left — Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-teal-200/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
              aria-label="Open sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Center — Welcome text */}
            <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-white tracking-wide flex-1 text-center">
              Welcome to Agromet Services Portal
            </h1>

            {/* Right — Helpline */}
            <a
              href="tel:09644300300"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-white bg-white/10 border border-white/15 hover:bg-white/20 transition-all duration-200"
              title="Call BRRI Helpline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
              <span className="hidden md:inline">Helpline:</span>
              <span className="hidden md:inline">09644300300</span>
            </a>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <WhatsAppButton />
    </div>
  );
};

export default DashboardLayout;
