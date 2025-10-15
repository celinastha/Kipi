import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [name, setName] = useState(null);

    useEffect(() => {
      console.log("AuthContext name:", name);
    }, [name]);


  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedName = localStorage.getItem("name");
    if (storedToken) setToken(storedToken);
    if (storedName) setName(storedName);
  }, []);

  const login = (newToken, userName) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("name", userName);
    setToken(newToken);
    setName(userName);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setToken(null);
    setName(null);
  };

  return (
    <AuthContext.Provider value={{ token, name, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);