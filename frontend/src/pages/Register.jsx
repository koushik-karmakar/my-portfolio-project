import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AlertBox } from "../components/AlertBox.jsx";
import GoogleLogin from "../components/GoogleLogin.jsx";
export default function Register() {
  const [userData, setUserData] = useState({
    fullname: "",
    username: "",
    email: "",
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [showConPassword, setShowConPassword] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [avatarImage, setAvatarImage] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const uploadUserData = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullname", userData.fullname);
      formData.append("username", userData.username);
      formData.append("email", userData.email);
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);
      formData.append("avatar", avatarImage);
      formData.append("coverImage", coverImage);
      if (
        !userData.fullname ||
        !userData.username ||
        !userData.email ||
        !password ||
        !confirmPassword
      ) {
        AlertBox("error", "All Field Required!");
        setLoading(false);
      }
      const backendBase = import.meta.env.VITE_BACKEND_PORT_LINK;
      const requestUrl = `${backendBase}/api/users/register`;
      const response = await axios.post(requestUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });
      if (response && response.data) {
        AlertBox("success", response?.data?.message, response?.status);
        setLoading(false);
      }
      setUserData({ fullname: "", username: "", email: "" });
      setPassword("");
      setConfirmPassword("");
      setAvatarImage(null);
      setCoverImage(null);
      setAvatarPreview(null);
      setCoverPreview(null);
      setAgreed(false);
    } catch (error) {
      AlertBox(
        "error",
        error.response?.data?.message || error.message,
        error.response?.status
      );
      setLoading(false);
      setUserData({ fullname: "", username: "", email: "" });
      setPassword("");
      setConfirmPassword("");
      setAvatarImage(null);
      setCoverImage(null);
      setAvatarPreview(null);
      setCoverPreview(null);
      setAgreed(false);
    }
    setLoading(false);
  };
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarImage(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };
  const handleAvatarClick = () => {
    document.getElementById("avatarImage").click();
  };
  const handleCoverImage = () => {
    document.getElementById("coverImage").click();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Create Your Account
          </h1>
          <p className="text-gray-600">
            Join our community and start your journey
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6 " onSubmit={uploadUserData}>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={userData.fullname}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    fullname: e.target.value,
                  })
                }
                placeholder="John Doe"
                name="fullname"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">@</span>
                <input
                  type="text"
                  value={userData.username}
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      username: e.target.value,
                    })
                  }
                  name="username"
                  placeholder="johndoe"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Must be unique</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                name="email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    email: e.target.value,
                  })
                }
                type="email"
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div
                onClick={() => handleAvatarClick()}
                className=" cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Cover Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>{" "}
                  </>
                )}
                <p className="text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 2MB</p>
                <input
                  type="file"
                  id="avatarImage"
                  name="avatarImage"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              <div
                onClick={() => handleCoverImage()}
                className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors duration-200"
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <svg
                      className="w-10 h-10 text-gray-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </>
                )}
                <p className="text-sm text-gray-600">Upload cover image</p>
                <input
                  type="file"
                  className="hidden"
                  name="coverImage"
                  id="coverImage"
                  accept="image/*"
                  onChange={handleCoverChange}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (confirmPassword && e.target.value !== confirmPassword) {
                      setPasswordError("Passwords do not match");
                    } else {
                      setPasswordError("");
                    }
                  }}
                  name="password"
                  type={showPassword ? "password" : "text"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 3l18 18M10.58 10.58A3 3 0 0113.42 13.42M9.88 4.24A9.53 9.53 0 0112 4c4.48 0 8.27 2.94 9.54 7a9.77 9.77 0 01-1.88 3.31M6.12 6.12A9.77 9.77 0 004.46 7.97 9.53 9.53 0 003.46 12c1.27 4.06 5.06 7 9.54 7a9.77 9.77 0 003.31-1.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />{" "}
                    </svg>
                  )}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                <div className="h-1 bg-red-300 rounded"></div>
                <div className="h-1 bg-yellow-300 rounded"></div>
                <div className="h-1 bg-blue-300 rounded"></div>
                <div className="h-1 bg-green-300 rounded"></div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (password && e.target.value !== password) {
                      setPasswordError("Passwords do not match");
                    } else {
                      setPasswordError("");
                    }
                  }}
                  name="confirtPassword"
                  type={showConPassword ? "password" : "text"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={() => setShowConPassword(!showConPassword)}
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 3l18 18M10.58 10.58A3 3 0 0113.42 13.42M9.88 4.24A9.53 9.53 0 0112 4c4.48 0 8.27 2.94 9.54 7a9.77 9.77 0 01-1.88 3.31M6.12 6.12A9.77 9.77 0 004.46 7.97 9.53 9.53 0 003.46 12c1.27 4.06 5.06 7 9.54 7a9.77 9.77 0 003.31-1.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />{" "}
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-500 mt-1">{passwordError}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={() => setAgreed(!agreed)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">
                I agree to the{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={!agreed || loading}
                className={`w-full py-3 px-4 cursor-pointer text-white font-medium rounded-lg transition-all duration-200 shadow-lg
                            ${
                              !agreed || loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            }
                          `}
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-600 mb-4">Or sign up with</p>
            <GoogleLogin />
            <div className=" mt-4 flex items-center justify-center gap-4 w-full">
              {/* GitHub */}
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 
               border border-gray-300 rounded-lg text-gray-700 
               hover:bg-gray-50 transition-all duration-200 w-full"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </button>

              {/* Facebook */}
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 
               border border-gray-300 rounded-lg text-gray-700 
               hover:bg-gray-50 transition-all duration-200 w-full"
              >
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to={"/login"}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
