import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AlertBox } from "./AlertBox.jsx";

function AddPhoneNumber() {
  const [number, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setEmail(user.email || "");
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const validatePhoneNumber = (number) => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length < 10 || cleaned.length > 15) {
      return false;
    }
    const phoneRegex = /^[1-9][0-9]{9,14}$/;
    return phoneRegex.test(cleaned);
  };
  const checkExistedNumber = async (number) => {
    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
      const response = await axios.post(
        `${backend}/api/users/user-number-check`,
        { number },
        { withCredentials: true }
      );

      return response.data.data.exists;
    } catch (error) {
      AlertBox(
        "error",
        error.response?.data?.message || "Failed to check number"
      );
      return false;
    }
  };
  const handleSendOTP = async () => {
    if (!validatePhoneNumber(number)) {
      AlertBox("error", "Please enter a valid phone number");
      return;
    }
    const exists = await checkExistedNumber(number);

    if (exists) {
      AlertBox("warning", "This number is already registered");
      return;
    }
    setLoading(true);
    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
      const response = await axios.post(
        `${backend}/api/users/send-mail-otp`,
        { email, number },
        { withCredentials: true }
      );

      if (response.data.emailSent) {
        // AlertBox("success", "OTP sent to your email address");
        setOtpSent(true);
        setStep(2);
        setTimer(600);
      }
    } catch (error) {
      AlertBox("error", error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      AlertBox("error", "Please enter a 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;

      const response = await axios.post(
        `${backend}/api/users/verify-mail-otp`,
        { email, otp, number },
        { withCredentials: true }
      );

      if (response?.data?.emailVerified) {
        AlertBox("success", response.data.message);

        setTimeout(() => {
          navigate("/whisper");
        }, 1500);
      } else {
        AlertBox("error", response.data.message || "OTP verification failed");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to verify OTP";
      AlertBox("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) {
      AlertBox("info", `Please wait ${formatTimer(timer)} before resending`);
      return;
    }

    await handleSendOTP();
  };
  const handleChangeNumber = () => {
    setStep(1);
    setOtp("");
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h1 className="text-2xl font-bold">
            {step === 1 ? "Add Phone Number" : "Verify OTP"}
          </h1>
          <p className="text-blue-100 mt-2">
            {step === 1
              ? "Secure your account with phone verification"
              : "Enter the OTP sent to your email"}
          </p>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full 
                ${
                  step >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                1
              </div>
              <div
                className={`h-1 w-20 ${
                  step >= 2 ? "bg-blue-600" : "bg-gray-200"
                }`}
              ></div>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full 
                ${
                  step >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">+</span>
                  </div>
                  <input
                    type="tel"
                    value={number}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                             transition-colors duration-200"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  We'll send a verification code to your email
                </p>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading || !number}
                className=" cursor-pointer w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 
                         text-white font-semibold rounded-lg hover:from-blue-700 
                         hover:to-indigo-700 transition-all duration-300 transform 
                         hover:-translate-y-0.5 shadow-lg hover:shadow-xl 
                         disabled:opacity-50 disabled:cursor-not-allowed 
                         disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending OTP...
                  </div>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg inline-block">
                  <svg
                    className="w-12 h-12 text-blue-600 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600">
                  OTP sent to: <span className="font-semibold">{email}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Check your email inbox for the 6-digit code
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtp(value);
                  }}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                           text-center text-2xl font-bold tracking-widest
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                           transition-colors duration-200"
                  disabled={loading}
                  maxLength={6}
                />
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={handleResendOTP}
                    disabled={timer > 0}
                    className="text-sm text-blue-600 hover:text-blue-800 
                             disabled:text-gray-400"
                  >
                    {timer > 0
                      ? `Resend in ${formatTimer(timer)}`
                      : "Resend OTP"}
                  </button>
                  <button
                    onClick={() => handleChangeNumber()}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Change Number
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 bg-linear-to-r from-green-600 to-emerald-600 
                           text-white font-semibold rounded-lg hover:from-green-700 
                           hover:to-emerald-700 transition-all duration-300 transform 
                           hover:-translate-y-0.5 shadow-lg hover:shadow-xl 
                           disabled:opacity-50 disabled:cursor-not-allowed 
                           disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-3 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    "Verify & Continue"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            <svg
              className="inline-block w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Your phone number helps secure your account and enable important
            features
          </p>
        </div>
      </div>
    </div>
  );
}

export default AddPhoneNumber;
