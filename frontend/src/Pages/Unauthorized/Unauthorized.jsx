import React from 'react'
import './Unauthorized.css'
import { Link } from "react-router-dom";


const Unauthorized = () => {
  return (
    <div className='Unauthorized'>
        <h2>🚫 Unauthorized</h2>
        <p>You must be logged in to access this page.</p>
        <Link to="/auth" className="authLink">
            Go to Login
        </Link>


    </div>
  )
}

export default Unauthorized