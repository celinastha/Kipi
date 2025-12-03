import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { token, loggedOut } = useAuth();

  if (!token) {
    return loggedOut
      ? <Navigate to="/auth" replace />
      : <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;