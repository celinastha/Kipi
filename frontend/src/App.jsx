import Navbar from './Components/Navbar/Navbar.jsx'
import Home from './Pages/Home/Home.jsx'
import MessagesPage from './Pages/Messages/Messages.jsx'
import { Routes, Route } from 'react-router-dom'
import './index.css'  

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/messages" element={<MessagesPage />} />
        </Routes>
      </div>
    </div>
  );
}
