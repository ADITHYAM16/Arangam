import { useState, useEffect } from 'react'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('adminLoggedIn') === 'true'
  })

  const handleLogin = () => {
    setIsLoggedIn(true)
    localStorage.setItem('adminLoggedIn', 'true')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('adminLoggedIn')
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App