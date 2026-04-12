import { Link } from "react-router-dom";

function Team({ doctors }) {
  return (
    <div className="App">
      <nav className="site-nav">
        <Link to="/" className="nav-logo">Oncology Clinic</Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/team">Team</Link>
        </div>
      </nav>

      <header className="page-header">
        <div className="section-header">
          <h1>Meet our medical team</h1>
          <p>Experienced oncology specialists committed to delivering personalized care.</p>
        </div>
      </header>

      <section className="section team-page-section">
        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <article key={doctor.name} className="card doctor-card team-card">
              <div className="portrait">{doctor.initials}</div>
              <h3>
                {doctor.highlight ? (
                  <span className="doctor-name-highlight">{doctor.name}</span>
                ) : (
                  doctor.name
                )}
              </h3>
              <p className="doctor-role">{doctor.role}</p>
              <p>{doctor.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div>
          <h2>Oncology Clinic</h2>
          <p>Delivering thoughtful cancer care with every patient journey.</p>
        </div>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/team">Team</Link>
        </div>
      </footer>
    </div>
  );
}

export default Team;
