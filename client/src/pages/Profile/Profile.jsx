import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { API_ENDPOINTS, getAuthHeaders, UPLOADS_BASE_URL } from "../../config/api";
import { useAuthContext } from "../../components/context/AuthProvider";

const Profile = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    mobileNumber: "",
    designation: "",
    organization: "",
    address: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (authUser) {
      setFormData({
        name: authUser.name || "",
        username: authUser.username || "",
        email: authUser.email || "",
        mobileNumber: authUser.mobileNumber || "",
        designation: authUser.designation || "",
        organization: authUser.organization || "",
        address: authUser.address || "",
      });
    }
  }, [authUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setFormData({
      name: authUser.name || "",
      username: authUser.username || "",
      email: authUser.email || "",
      mobileNumber: authUser.mobileNumber || "",
      designation: authUser.designation || "",
      organization: authUser.organization || "",
      address: authUser.address || "",
    });
    setIsEditing(false);
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only image files (JPEG, PNG, GIF, WebP) are allowed");
      return;
    }

    // Validate file size (1 MB)
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Image size must be less than 1 MB");
      return;
    }

    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.uploadProfilePicture(authUser.id), {
        method: "POST",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to upload picture");

      setAuthUser({ ...authUser, profilePicture: data.profilePicture });
      toast.success("Profile picture updated!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingPicture(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!authUser.profilePicture) return;
    setUploadingPicture(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.removeProfilePicture(authUser.id), {
        method: "DELETE",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to remove picture");

      setAuthUser({ ...authUser, profilePicture: null });
      toast.success("Profile picture removed!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingPicture(false);
    }
  };

  const profilePictureUrl = authUser?.profilePicture
    ? `${UPLOADS_BASE_URL}/${authUser.profilePicture}`
    : null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim()) {
      toast.error("Name, username and email are required");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(API_ENDPOINTS.userById(authUser.id), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update profile");
      setAuthUser(data.user);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      const response = await fetch(API_ENDPOINTS.changePassword(authUser.id), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to change password");
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const passwordStrength = (password) => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-400" };
    if (score <= 2) return { level: 2, label: "Fair", color: "bg-orange-400" };
    if (score <= 3) return { level: 3, label: "Good", color: "bg-yellow-400" };
    if (score <= 4) return { level: 4, label: "Strong", color: "bg-emerald-400" };
    return { level: 5, label: "Very Strong", color: "bg-emerald-500" };
  };

  const strength = passwordStrength(passwordData.newPassword);

  const profileFields = [
    { key: "name", label: "Full Name", icon: "user", required: true },
    { key: "username", label: "Username", icon: "at", required: true },
    { key: "email", label: "Email Address", icon: "email", required: true, type: "email" },
    { key: "mobileNumber", label: "Mobile Number", icon: "phone" },
    { key: "designation", label: "Designation", icon: "briefcase" },
    { key: "organization", label: "Organization", icon: "building" },
    { key: "address", label: "Address", icon: "location", multiline: true },
  ];

  const iconMap = {
    user: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    ),
    at: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
    ),
    email: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    ),
    phone: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    ),
    briefcase: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    ),
    building: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    ),
    location: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    ),
  };

  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 md:gap-8">

              {/* Avatar with upload */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full ring-[3px] ring-teal-100 shadow-md overflow-hidden">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt={authUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-[#0d5555] to-[#0a3d3d] flex items-center justify-center text-white text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight">
                      {getInitials(authUser.name)}
                    </div>
                  )}
                </div>

                {/* Camera overlay on hover */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  className="absolute inset-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200 cursor-pointer"
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-0.5">
                    {uploadingPicture ? (
                      <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <>
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        </svg>
                        <span className="text-[9px] sm:text-[10px] text-white font-medium">Change</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Remove button */}
                {profilePictureUrl && !uploadingPicture && (
                  <button
                    type="button"
                    onClick={handleRemoveProfilePicture}
                    className="absolute top-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 ring-2 ring-white"
                    title="Remove picture"
                  >
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />

                {/* Size hint */}
                <p className="text-[9px] text-gray-400 text-center mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Max 1 MB</p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                {/* Name row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
                  <h1 className="text-xl sm:text-2xl md:text-[1.7rem] font-bold text-gray-900 truncate leading-tight">{authUser.name}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border capitalize ${getStatusColor(authUser.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${authUser.status === "approved" ? "bg-emerald-500" : authUser.status === "pending" ? "bg-amber-500" : "bg-red-500"}`} />
                      {authUser.status}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#0d4a4a]/8 text-[#0d4a4a] capitalize">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                      {authUser.role}
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">@{authUser.username}</p>

                {/* Quick info chips */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3 sm:mt-4">
                  {authUser.email && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg text-[10px] sm:text-xs text-gray-500 border border-gray-100">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">{iconMap.email}</svg>
                      {authUser.email}
                    </span>
                  )}
                  {authUser.designation && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg text-[10px] sm:text-xs text-gray-500 border border-gray-100">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">{iconMap.briefcase}</svg>
                      {authUser.designation}
                    </span>
                  )}
                  {authUser.organization && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg text-[10px] sm:text-xs text-gray-500 border border-gray-100">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">{iconMap.building}</svg>
                      {authUser.organization}
                    </span>
                  )}
                  {authUser.mobileNumber && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg text-[10px] sm:text-xs text-gray-500 border border-gray-100">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">{iconMap.phone}</svg>
                      {authUser.mobileNumber}
                    </span>
                  )}
                  {authUser.createdAt && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg text-[10px] sm:text-xs text-gray-500 border border-gray-100">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      Joined {new Date(authUser.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5">
          <div className="flex gap-1">
            {[
              { id: "profile", label: "Profile Details", icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )},
              { id: "security", label: "Security", icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              )},
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-[#0d4a4a] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Details Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Personal Information</h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                  {isEditing ? "Update your profile details below" : "Your profile information at a glance"}
                </p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0d4a4a] hover:bg-[#0a3d3d] text-white text-xs sm:text-sm font-medium rounded-xl transition-colors"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              ) : (
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs sm:text-sm font-medium rounded-xl transition-colors"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="p-4 sm:p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                  {profileFields.map((field) => (
                    <div key={field.key} className={field.multiline ? "sm:col-span-2" : ""}>
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {iconMap[field.icon]}
                        </svg>
                        {field.label}
                        {field.required && <span className="text-red-400">*</span>}
                      </label>

                      {isEditing ? (
                        field.multiline ? (
                          <textarea
                            name={field.key}
                            value={formData[field.key]}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3.5 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 resize-none bg-gray-50/50 placeholder:text-gray-300 transition-all"
                            placeholder={`Enter your ${field.label.toLowerCase()}`}
                          />
                        ) : (
                          <input
                            type={field.type || "text"}
                            name={field.key}
                            value={formData[field.key]}
                            onChange={handleInputChange}
                            required={field.required}
                            className="w-full px-3.5 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 bg-gray-50/50 placeholder:text-gray-300 transition-all"
                            placeholder={`Enter your ${field.label.toLowerCase()}`}
                          />
                        )
                      ) : (
                        <div className="px-3.5 py-2.5 bg-gray-50/80 rounded-xl border border-gray-100 min-h-10 flex items-start">
                          <p className={`text-sm ${formData[field.key] ? "text-gray-700" : "text-gray-300 italic"}`}>
                            {formData[field.key] || `No ${field.label.toLowerCase()} provided`}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Account info */}
                {!isEditing && (
                  <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-100">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-500 mb-3 sm:mb-4 uppercase tracking-wide">Account Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                        <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Role</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 capitalize mt-0.5">{authUser.role}</p>
                      </div>
                      <div className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                        <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Status</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 capitalize mt-0.5">{authUser.status}</p>
                      </div>
                      <div className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                        <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Member Since</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 mt-0.5">
                          {authUser.createdAt
                            ? new Date(authUser.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save bar */}
              {isEditing && (
                <div className="flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gray-50/50 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Change Password</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Ensure your account stays secure by using a strong password
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="p-4 sm:p-6 md:p-8">
              <div className="max-w-md space-y-4 sm:space-y-5">
                {/* Current Password */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-3.5 py-2.5 pr-10 text-sm text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 bg-gray-50/50 placeholder:text-gray-300 transition-all"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showCurrentPassword ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2.5 pr-10 text-sm text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 bg-gray-50/50 placeholder:text-gray-300 transition-all"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPassword ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Strength meter */}
                  {passwordData.newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.level ? strength.color : "bg-gray-200"}`} />
                        ))}
                      </div>
                      <p className={`text-[10px] sm:text-xs mt-1 font-medium ${
                        strength.level <= 1 ? "text-red-500" : strength.level <= 2 ? "text-orange-500" : strength.level <= 3 ? "text-yellow-600" : "text-emerald-600"
                      }`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                      className={`w-full px-3.5 py-2.5 pr-10 text-sm text-gray-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 bg-gray-50/50 placeholder:text-gray-300 transition-all ${
                        passwordData.confirmPassword && passwordData.confirmPassword !== passwordData.newPassword
                          ? "border-red-300"
                          : passwordData.confirmPassword && passwordData.confirmPassword === passwordData.newPassword
                            ? "border-emerald-300"
                            : "border-gray-200"
                      }`}
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.confirmPassword !== passwordData.newPassword && (
                    <p className="text-[10px] sm:text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                  {passwordData.confirmPassword && passwordData.confirmPassword === passwordData.newPassword && (
                    <p className="text-[10px] sm:text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Passwords match
                    </p>
                  )}
                </div>
              </div>

              {/* Security tips */}
              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-teal-50/50 rounded-xl border border-teal-100">
                <p className="text-xs sm:text-sm font-semibold text-[#0d4a4a] mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  Password Tips
                </p>
                <ul className="space-y-1 text-[10px] sm:text-xs text-gray-500">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-[#0d4a4a] rounded-full shrink-0" />
                    Use at least 6 characters
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-[#0d4a4a] rounded-full shrink-0" />
                    Include uppercase and lowercase letters
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-[#0d4a4a] rounded-full shrink-0" />
                    Add numbers and special characters
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-[#0d4a4a] rounded-full shrink-0" />
                    Avoid using personal information
                  </li>
                </ul>
              </div>

              {/* Submit */}
              <div className="mt-5 sm:mt-6">
                <button
                  type="submit"
                  disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {changingPassword ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
