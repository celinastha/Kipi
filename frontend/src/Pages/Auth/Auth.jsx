import React from 'react'
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../Context/AuthContext';
import { ToastContainer, toast} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import './Auth.css'
import { MdError } from "react-icons/md";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { authService } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {

      const endpoint = isLogin ? "login" : "signup";
      const payload = isLogin?
        { email, password }
        : { name, email, password };

      await authService(endpoint, payload);
      
      toast.success(`${isLogin ? "Logged in" : "Account created"} successfully!`, { autoClose: 1800, closeButton: false });

      setEmail("");
      setPassword("");
      setName("");

      if (isLogin) {
        navigate("/profile");
      } else {
        setIsLogin(true);
        navigate("/auth");
      }
      
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { autoClose: 1800, closeButton: false });
    }
  };



  return (
    <div className='Auth'>
      <div className='formContainer'>
        <h2>{isLogin ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleSubmit}>

          {error && <p className='errorMsg'><MdError />{error.replace(/_/g, ' ')}</p>}


          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='nameInput'
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          /><br/>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          /><br/>

          <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
        </form>


        <p className='switchQuestionMsg'>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          
          <span
            onClick={() => setIsLogin(!isLogin)}
            className='switch'
          >
            {isLogin ? "Sign Up" : "Login"}
          </span>

        </p>
      </div>
    </div>
  );

}

export default Auth

