import React from 'react'
import './Navbar.css'
import { IoMdSearch } from "react-icons/io";
import { FaUserFriends } from "react-icons/fa";
import { LuMessageCircleMore } from "react-icons/lu";
import { SlCalender } from "react-icons/sl";
import { IoNotifications } from "react-icons/io5";

const Navbar = () => {
  return (
    <div className='Navbar'>
        <div className='myAvatar'>
            <img src="https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_1.png"></img>
        </div>
        <div className='navIcons'>
            <li className='navIconsList'>
                <ul>
                    <a><IoMdSearch className='icon'/></a>
                    <a><FaUserFriends className='icon icon2'/></a>
                    <a><LuMessageCircleMore className='icon icon2'/></a>
                    <a><SlCalender className='icon icon3'/></a>
                    <a><IoNotifications className='icon icon2'/></a>
                </ul>
            </li>
        </div>
    </div>
  )
}

export default Navbar