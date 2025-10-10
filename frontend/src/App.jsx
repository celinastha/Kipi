import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Navbar from './Components/Navbar/Navbar.jsx'


function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <Navbar/>
    </div>
  
  )
}

export default App
