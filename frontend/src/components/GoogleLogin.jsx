import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AlertBox } from "./AlertBox.jsx";
export default function GoogleLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    google.accounts.id.renderButton(
      document.getElementById("google-login-btn"),
      {
        theme: "outline",
        size: "large",
        width: "100%",
      }
    );
  }, []);

  const handleCredentialResponse = async (res) => {
    try {
      const token = res.credential;
      const backendLink = import.meta.env.VITE_BACKEND_PORT_LINK;
      const response = await axios.post(
        `${backendLink}/api/users/google-login`,
        { token },
        { withCredentials: true }
      );

      AlertBox("success", response.data.message, response.status);
      const user = response.data.data;
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/");
    } catch (error) {
      AlertBox(
        "error",
        error.response?.data?.message || "Google login failed",
        error.response?.status
      );
    }
  };

  return <div id="google-login-btn"></div>;
}
