import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CreateAccount from './CreateAccount.jsx'
import Home from './Home.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-account" element={<CreateAccount />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App