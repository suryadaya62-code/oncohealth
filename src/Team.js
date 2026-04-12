import React from 'react';

function Team({ doctors, onBack }) {
  return (
    <>
      <div className="team-page">
        <h1>Our full team</h1>
        <p className="subtitle">Dedicated specialists committed to your care.</p>
        <div className="doctor-grid">
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
          <button type="button" onClick={onBack}>Book appointment</button>
        </div>
      </footer>
    </>
  );
}

export default Team;
