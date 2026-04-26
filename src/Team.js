function Team({ doctors, onBack, onBookAppointment }) {
  return (
    <>
      <div className="team-page">
        <h1>Our full team</h1>
        <p className="subtitle">Dedicated specialists committed to your care.</p>
        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <article key={doctor.name} className="doctor-card">
              <div className="portrait">{doctor.initials}</div>
              <h3 className={doctor.highlight ? 'highlight' : ''}>{doctor.name}</h3>
              <p className="doctor-role">{doctor.role}</p>
              <p>{doctor.bio}</p>
            </article>
          ))}
        </div>
        <div className="section-center">
          <button className="btn-secondary" onClick={onBack}>← Back to home</button>
        </div>
      </div>

      <footer className="site-footer">
        <div>
          <h2>Oncology Clinic</h2>
          <p>Delivering thoughtful cancer care with every patient journey.</p>
        </div>
        <div className="footer-links">
          <button type="button" onClick={onBack}>Home</button>
          <button type="button" onClick={onBookAppointment || onBack}>Book appointment</button>
        </div>
      </footer>
    </>
  );
}

export default Team;
