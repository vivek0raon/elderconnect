import { useState, useEffect } from "react";
import api from "../services/api";
import { AuthContext } from "./authContextObject";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem("token"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;
    api
      .get("/auth/me")
      .then((res) => {
        if (!cancelled) setUser(res.data?.user || res.data);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.token) {
      localStorage.setItem("token", res.data.token);
    }
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post("/auth/register", userData);
    if (res.data?.token) {
      localStorage.setItem("token", res.data.token);
    }
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

