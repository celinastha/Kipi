import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './Components/Navbar/Navbar.jsx'
import Auth from './Pages/Auth/Auth.jsx'
import Profile from './Pages/Profile/Profile.jsx'
import Search from './Pages/Search/Search.jsx'
import Friends from './Pages/Friends/Friends.jsx'
import Messages from './Pages/Messages/Messages.jsx'
import Calender from './Pages/Calender/Calender.jsx'
import Notifications from './Pages/Notifications/Notifications.jsx'
import { ToastContainer, toast} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';



function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='app'>
      <Navbar/>
      <div className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace/>}/>
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/calender" element={<Calender />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
        <ToastContainer/>
      </div>
    </div>
  
  )
}

export default App
