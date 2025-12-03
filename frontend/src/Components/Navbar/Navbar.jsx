import React from 'react'
import './Navbar.css'
import { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import { IoMdSearch } from "react-icons/io";
import { FaUserFriends } from "react-icons/fa";
import { LuMessageCircleMore } from "react-icons/lu";
import { SlCalender } from "react-icons/sl";
import { IoNotifications } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import { useAuth } from '../../Context/AuthContext';

const Navbar = () => {

    const [hovered, setHovered] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, token, currentUserId } = useAuth();
    const [contextReady, setContextReady] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentPfp, setCurrentPfp] = useState(null);

    useEffect(() => {
        setContextReady(true);
    }, []);

    useEffect(() => {
            const fetchUser = async () => {
            try {
                const res = await fetch(`http://localhost:3000/users/${currentUserId}`, {
                headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setCurrentUser(data);
                setCurrentPfp(data.pfp);
            } catch (err) {
                console.error("Failed to fetch user:", err);
            }
            };
            if (token) fetchUser();
    }, [token, currentUserId, currentUser]);


    const handleLogout = async () => {
        if (!contextReady) return;
        console.log("Navbar logout token:", token);

        if (!token) {
            console.warn("No token available for logout");
            logout();
            return navigate("/auth");
        }

        try {
        await fetch("http://localhost:3000/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        logout();
        navigate("/auth");
        toast.success("Logged Out Successfully!", { autoClose: 1800, closeButton: false });
        
        } catch (err) {
        console.error("Logout failed", err);
        }
    };


    if (location.pathname === '/auth' || location.pathname === '/unauthorized') {
        return null;
    };

    const links = [
    { id: 1, to: "/search", icon: <IoMdSearch className='icon search_icon'/>, label: "Search" },
    { id: 2, to: "/friends", icon: <FaUserFriends className='icon friends_icon'/>, label: "Friends" },
    { id: 3, to: "/messages", icon: <LuMessageCircleMore className='icon messages_icon'/>, label: "Messages" },
    { id: 4, to: "/calender", icon: <SlCalender className='icon calender_icon'/>, label: "Calender" },
    { id: 5, to: "/notifications", icon: <IoNotifications className='icon notifications_icon'/>, label: "Notifications" },
  ];   

  return (
    <div className='Navbar'>
        <div className="myPfp" 
            onMouseEnter={() => setHovered("profile")}
            onMouseLeave={() => setHovered(null)}
        >
            <Link to="/profile">
                <img src={currentPfp}></img>
                {hovered === "profile" && (
                    <div className="hovered_label">Profile</div>
                )}
            </Link>
        </div>


        <div className='navIconsList'>

            {links.map(({ id, to, icon, label }) => {
                const isActive = location.pathname === to;
                return(
                    <div>
                        <div
                            key={id}
                            className='navLink'
                            onMouseEnter={() => setHovered(id)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <Link to={to} className={`navIcon ${isActive? "active" : ""}`}>
                                {icon}
                            </Link>
                        </div>

                        {hovered === id && (
                            <div className="hovered_label">
                                {label}
                            </div>
                        )}
                    
                    </div>
                ); 
            })}
            
            <div className="logout navIcon" 
                onClick={handleLogout}
                onMouseEnter={() => setHovered("logout")}
                onMouseLeave={() => setHovered(null)}
            >
                <FiLogOut className='icon logout_icon'/>
                {hovered === "logout" && (
                    <div className="hovered_label">Logout</div>
                )}
            </div>

        </div>
    </div>
  )
}

export default Navbar;