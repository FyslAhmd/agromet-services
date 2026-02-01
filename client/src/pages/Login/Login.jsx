import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthContext } from "../../components/context/AuthProvider";
import { API_ENDPOINTS } from "../../config/api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser, setAuthUser, loadingUser } = useAuthContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loadingUser && authUser) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [authUser, loadingUser, navigate, location]);

  // Show loading while checking auth status
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#026666] via-[#035555] to-[#024444]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-white"></span>
          <p className="mt-4 text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed. Please try again.");
      }

      // Store token and user ID in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id);
      setAuthUser(data.user);
      toast.success("Login successful!");

      // Redirect to the original page or home
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || "Login failed. Please try again.");
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen w-screen flex items-center justify-center relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#026666] via-[#035555] to-[#024444]"></div>

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Main container */}
        <div className="flex w-full min-h-screen z-10 relative">
          {/* Left half - Information - Hidden on mobile */}
          <div className="hidden lg:flex w-1/2 min-h-screen items-center justify-center p-8">
            <div className="p-8 w-full max-w-lg text-center">
              {/* Weather icons */}
              <div className="text-6xl mb-6 space-x-4">
                <span>🌤️</span>
                <span>🌡️</span>
                <span>🌧️</span>
              </div>

              <h2 className="text-4xl font-bold text-white mb-4">
                Agromet Services
              </h2>
              
              <p className="text-white/80 text-xl mb-8">
                Real-time Weather Data & Agricultural Meteorology
              </p>

              <div className="space-y-4 text-white/70">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📊</span>
                  <span>Agromet Weather Station Data</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📈</span>
                  <span>Historical Climate Analysis</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">🌾</span>
                  <span>Rice Analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right half - Login form */}
          <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-4 lg:justify-start lg:p-8">
            <div className="bg-white/98 backdrop-blur-sm px-10 py-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#04cccc]/20">
              {/* Logo */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <img src="/logo.png" alt="BRRI Logo" className="w-20" />
                </div>
                <h1 className="text-2xl font-bold text-[#026666] mb-2">
                  Agromet Services
                </h1>
                <p className="text-[#338485]">Bangladesh Rice Research Institute</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Mobile Number Input */}
                {/* Username Input */}
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-gray-700"
                    htmlFor="username"
                  >
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username or email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026666] focus:border-[#04cccc] transition duration-200 bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-gray-700"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026666] focus:border-[#04cccc] transition duration-200 bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-red-700 text-sm font-medium">
                        {error}
                      </span>
                    </div>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  className={`w-full bg-gradient-to-r from-[#026666] to-[#024444] text-white py-3 px-4 rounded-xl font-semibold text-lg shadow-lg hover:from-[#035555] hover:to-[#026666] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#04cccc] transition duration-300 transform hover:scale-[1.02] border border-[#04cccc]/20 ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Logging in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-[#026666] font-semibold hover:underline"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-[#338485]">Agromet Lab</p>
                <p className="text-base text-[#026666]/70 font-medium mt-1">
                  Bangladesh Rice Research Institute
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
