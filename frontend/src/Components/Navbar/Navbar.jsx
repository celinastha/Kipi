import React from 'react'
import './Navbar.css'
import { IoMdSearch } from "react-icons/io";
import { FaUserFriends } from "react-icons/fa";
import { LuMessageCircleMore } from "react-icons/lu";
import { SlCalender } from "react-icons/sl";
import { IoNotifications } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <div className='Navbar'>
      <div className='myAvatar' onClick={() => navigate('/')} style={{ cursor: 'pointer'}}>
        <img src="https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_1.png" alt="User Avatar" />
      </div>

      <div className='navIcons'>
        <li className='navIconsList'>
          <ul>
            <button className="navbtn"><IoMdSearch className='icon'/></button>
            <button className="navbtn"><FaUserFriends className='icon icon2'/></button>
            <button className="navbtn" onClick={() => navigate('/messages')}>
              <LuMessageCircleMore className='icon icon2'/>
            </button>
            <button className="navbtn"><SlCalender className='icon icon3'/></button>
            <button className="navbtn"><IoNotifications className='icon icon2'/></button>
          </ul>
        </li>
      </div>
    </div>
  );
}
