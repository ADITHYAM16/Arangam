import { useState } from 'react'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(() => {
    return localStorage.getItem('adminUsername')
  })

  const handleLogin = (username: string) => {
    setLoggedInUsername(username)
    localStorage.setItem('adminUsername', username)
  }

  const handleLogout = () => {
    setLoggedInUsername(null)
    localStorage.removeItem('adminUsername')
  }

  return (
    <div className="App">
      {loggedInUsername ? (
        <AdminDashboard onLogout={handleLogout} currentUsername={loggedInUsername} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App