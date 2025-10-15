import React from 'react'
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../Context/AuthContext';
import './Profile.css'

const Profile = () => {
  const { token, name } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token === null) return;
    if (!token) navigate("/auth");
  }, [token]);


  return (
    <div className='Profile'>
      <h2 className='logo'>Welcome, {name}!</h2>
    </div>
  );
}

export default Profile