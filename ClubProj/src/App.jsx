import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home          from './Home.jsx'
import Login         from './Login.jsx'
import CreateAccount from './CreateAccount.jsx'
import Dashboard     from './Dashboard.jsx'
import Clubs         from './Clubs.jsx'
import ClubPage      from './Clubpage.jsx'
import NewClub       from './Newclub.jsx'
import NewEventPage  from './NewEventPage'
import EditClubPage  from './EditClubPage'
import EventPage     from './EventPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Home />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/create-account"  element={<CreateAccount />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/clubs"           element={<Clubs />} />
        <Route path="/clubs/new"       element={<NewClub />} />
        <Route path="/clubs/:id"       element={<ClubPage />} />
        <Route path="/clubs/:id/events/new"              element={<NewEventPage />} />
        <Route path="/clubs/:id/events/:eventId"         element={<EventPage />} />
        <Route path="/clubs/:id/edit"                    element={<EditClubPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App 