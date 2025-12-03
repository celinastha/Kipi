import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [name, setName] = useState(localStorage.getItem("name"));
    const [loggedOut, setLoggedOut] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(localStorage.getItem("currentUserId"));
    const navigate = useNavigate();

    useEffect(() => {
      console.log("AuthContext name:", name);
    }, [name]);

  const authService = async (endpoint, payload) => {
    const res = await fetch(`http://localhost:3000/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    if (endpoint === "login") {
      localStorage.setItem("token", data.token);
      localStorage.setItem("name", data.name);
      localStorage.setItem("currentUserId", data.currentUserId);

      setToken(data.token);
      setName(data.name);
      setCurrentUserId(data.currentUserId);

      console.log("Current from auth context response is: ", data.currentUserId);
      console.log("Login successful:", data);
    }

     if (endpoint === "signup") {   
      console.log("Signup successful:", data);
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("currentUserId");
    setToken(null);
    setName(null);
    setCurrentUserId(null);
    setLoggedOut(true);
    navigate("/auth", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ token, name, authService, logout, currentUserId, loggedOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);