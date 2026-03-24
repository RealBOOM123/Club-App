import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Home.jsx'
import Login from './Login.jsx'
import CreateAccount from './CreateAccount.jsx'
import Dashboard from './Dashboard.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/dashboard"      element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App