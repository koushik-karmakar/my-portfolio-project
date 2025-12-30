import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { checkAuth } from "../utils/auth.jsx";
import LoadingScreen from "./LoadingScreen.jsx";

export default function PrivateRoute() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const verify = async () => {
      try {
        const isAuth = await checkAuth();
        setAuthenticated(isAuth);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, []);

  if (loading) return <LoadingScreen />;

  return authenticated ? <Outlet /> : <Navigate to="/login" />;
}
