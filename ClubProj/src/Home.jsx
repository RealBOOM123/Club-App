import './App.css'
import { Link } from 'react-router-dom'

function Home() {
  return (
      <div className="clubhub">
 
      {/* Background layers */}
      <div className="bg-layer" />
 
      {/* ── Navbar ── */}
      <nav className="navbar">
        <a className="nav-logo" href="#">ClubHub</a>
 
        <ul className="nav-links">
          <li><a href="#statistics">Statistics</a></li>
          <li><a href="#numbers">Numbers</a></li>
          <li><a href="#yap">Yap</a></li>
        </ul>
 
        <div className="nav-actions">
          <a href="#" className="btn btn-outline">Log In</a>
          <Link to="/create-account" className="btn btn-solid">Create Account</Link>
        </div>
      </nav>
 
      {/* ── Hero ── */}
      <section className="hero">
        <span className="hero-tag">Your Club. Your Community.</span>
 
        <h1 className="hero-title">
          CLUB
          <br />
          HUB
          <span className="hero-sub">Where Members Meet</span>
        </h1>
 
        <p className="hero-body">
          Manage clubs, track stats, and connect with members —
          all in one clean, powerful hub.
        </p>
 
        <div className="hero-cta">
          <a href="#" className="btn btn-solid btn-lg">Get Started Free</a>
          <a href="#" className="btn btn-outline btn-lg">Learn More</a>
        </div>
      </section>
 
      <div className="divider" />
 
      {/* ── Stats ── */}
      <div className="stats">
        {[
          { label: "Active Clubs",   value: "1,240", sub: "Across 18 categories" },
          { label: "Total Members",  value: "48.6K", sub: "+12% this month"      },
          { label: "Events Hosted",  value: "3,800", sub: "Since launch"         },
        ].map(({ label, value, sub }) => (
          <div className="stat" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>
 
      <div className="divider" />
 
      {/* ── Sub Nav ── */}
      <nav className="sub-nav">
        <a href="#statistics" id="statistics">Statistics</a>
        <a href="#numbers"   id="numbers">Numbers</a>
        <a href="#yap"       id="yap">Yap</a>
      </nav>
 
      {/* ── Footer ── */}
      <footer className="footer">
        <span className="footer-logo">ClubHub</span>
        <span className="footer-contact">
          Questions?{" "}
          <a href="tel:5104837627">510 · 483 · 7627</a>
        </span>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Support</a>
        </div>
      </footer>
 
    </div>
  )
}

export default Home