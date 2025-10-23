import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './Components/Navbar/Navbar.jsx'
import Auth from './Pages/Auth/Auth.jsx'
import Profile from './Pages/Profile/Profile.jsx'
import Search from './Pages/Search/Search.jsx'
import Friends from './Pages/Friends/Friends.jsx'
import Messages from './Pages/Messages/Messages.jsx'
import CalenderPage from './Pages/Calender/Calender.jsx'
import './index.css';
import Notifications from './Pages/Notifications/Notifications.jsx'
import { ToastContainer, toast} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './Components/ProtectedRoute.jsx'
import Unauthorized from './Pages/Unauthorized/Unauthorized.jsx'



function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='app'>
      <Navbar/>
      <div className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace/>}/>
          <Route path="/auth" element={<Auth />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/profile" element={<ProtectedRoute> <Profile /> </ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute> <Search /> </ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute> <Friends /> </ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute> <Messages /> </ProtectedRoute>} />
          <Route path="/calender" element={<ProtectedRoute> <CalenderPage /> </ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute> <Notifications /> </ProtectedRoute>} />
        </Routes>
        <ToastContainer/>
      </div>
    </div>
  
  )
}

export default App
