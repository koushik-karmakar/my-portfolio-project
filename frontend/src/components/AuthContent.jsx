import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AlertBox, ConfirmBox } from "./AlertBox.jsx";
import { useNavigate } from "react-router-dom";
import { checkAuth } from "../utils/auth.jsx";

function AuthContent() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmed = await ConfirmBox(
      "Logout Confirmation",
      "Are you sure you want to logout?",
      "Yes, logout!"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
      const response = await axios.post(
        `${backend}/api/users/logout`,
        {},
        { withCredentials: true }
      );
      if (response) {
        AlertBox("success", response.data.message, response.status);
        setLoggedIn(false);
        localStorage.removeItem("user");
        navigate("/");
      }
    } catch (error) {
      AlertBox(
        "error",
        error.response?.data?.message || "Logout failed!",
        error.response?.status
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const verify = async () => {
      try {
        const isLogin = await checkAuth();
        setLoggedIn(isLogin);
        const localUser = localStorage.getItem("user");
        const getUser = JSON.parse(localUser);
        setUser(getUser);
      } catch {
        setLoggedIn(false);
        setUser({});
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, []);

  return (
    <>
      {loggedIn ? (
        <div className="w-full flex justify-between space-x-4">
          <div className="flex items-center space-x-3 bg-linear-to-r from-gray-800 to-gray-900 px-6 py-3 rounded-xl border border-gray-700/30 shadow-lg">
            <div className="relative">
              <img
                referrerPolicy="no-referrer"
                src={
                  user?.avatar ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                }
                alt={user?.username}
                className="w-10 h-10 rounded-full border-2 border-purple-500/30"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-900 rounded-full"></div>
            </div>
            <div className="text-white">
              <p className="font-semibold text-sm">
                {user?.fullname?.includes(" ")
                  ? user.fullname.split(" ")[0]
                  : user?.fullname}
              </p>
              {/* <p className="text-xs text-gray-400">Administrator</p> */}
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="cursor-pointer px-8 py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl focus:outline-none focus:ring-3 focus:ring-purple-500 focus:ring-offset-2 active:translate-y-0 border border-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                />
              </svg>
              {loading ? "Logging Out..." : "Logout"}
            </div>
          </button>
        </div>
      ) : (
        <div className="w-full flex justify-end space-x-4">
          <Link
            to={"/login"}
            className=" cursor-pointer px-8 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-offset-2 active:translate-y-0"
          >
            <div className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Login
            </div>
          </Link>

          <Link
            to={"/register"}
            className="cursor-pointer px-8 py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl focus:outline-none focus:ring-3 focus:ring-purple-500 focus:ring-offset-2 active:translate-y-0 border border-purple-500/20"
          >
            <div className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Register
            </div>
          </Link>
        </div>
      )}
    </>
  );
}

export { AuthContent };
