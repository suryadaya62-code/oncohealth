import { useState, useRef, useEffect } from 'react';
import './App.css';
import Team from './Team';
import doctors from './data/doctors';

const services = [
  {
    icon: '🔬',
    title: 'Cancer screening',
    description:
      'Advanced imaging, lab testing, and personalized risk assessments for early detection.',
  },
  {
    icon: '📋',
    title: 'Treatment planning',
    description:
      'Evidence-based oncology care, chemotherapy coordination, and supportive services.',
  },
  {
    icon: '🤝',
    title: 'Patient support',
    description:
      'Nutrition guidance, counseling, and a dedicated care team to keep you informed and strong.',
  },
];

const testimonials = [
  {
    name: 'Maria T.',
    quote:
      'The team made me feel supported every step of the way. Their care gave me confidence and hope.',
  },
  {
    name: 'James R.',
    quote:
      'Fast, compassionate, and professional. I felt safe in the hands of experienced specialists.',
  },
];

// Doctor schedule with available time slots
const doctorSchedule = {
  'Dr. Devmalya Banerjee': {
    availability: 'Monday to Friday',
    timeSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
  },
  'Dr. Pritam Ray': {
    availability: 'Tuesday to Friday',
    timeSlots: ['10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'],
  },
  'Dr. Shaoni Parai': {
    availability: 'Monday, Wednesday, Friday',
    timeSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM'],
  },
};

function App() {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const [page, setPage] = useState('home');
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    doctor: '', 
    date: '', 
    time: '',
    notes: '' 
  });
  const [appointments, setAppointments] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [backendReady, setBackendReady] = useState(false);
  const appointmentRef = useRef(null);

  // Ping backend on load to wake it up from Render sleep
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/ping`)
      .then(() => setBackendReady(true))
      .catch(() => {
        // Backend unreachable — still allow form, but warn user
        setBackendReady(false);
      });
  }, [BACKEND_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.doctor || !form.date || !form.time) {
      setError('Please fill in all required fields.');
      setSubmitted(false);
      return;
    }
    
    try {
      setError('');
      
      // Send to backend to trigger notifications
      const response = await fetch(`${BACKEND_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to book appointment');
      }

      // Add to local list
      setAppointments([...appointments, form]);
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', doctor: '', date: '', time: '', notes: '' });
      
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setError(err.message || 'Error booking appointment. Please try again.');
      console.error('Appointment booking error:', err);
    }
  };

  const scrollToAppt = () => {
    setPage('home');
    setTimeout(() => {
      appointmentRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const showTeam = () => {
    setPage('team');
    window.scrollTo(0, 0);
  };

  const showHome = () => {
    setPage('home');
    window.scrollTo(0, 0);
  };

  return (
    <div className="App">
      {/* NAV */}
      <nav className="site-nav">
        <span className="nav-logo" onClick={showHome}>
          Oncology Clinic
        </span>
        <div className="nav-links">
          <button type="button" onClick={showHome}>Home</button>
          <button type="button" onClick={showTeam}>Team</button>
          <button type="button" onClick={scrollToAppt} className="nav-cta">
            Book appointment
          </button>
        </div>
      </nav>

      {/* TEAM PAGE */}
      {page === 'team' && <Team doctors={doctors} onBack={showHome} />}

      {/* HOME PAGE */}
      {page === 'home' && (
        <>
          {/* HERO */}
          <section className="hero">
            <span className="eyebrow">Oncology Clinic</span>
            <h1>Compassionate cancer care designed for your recovery.</h1>
            <p className="hero-copy">
              We combine modern oncology treatment with patient-centered support to guide you and
              your family through every stage.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={scrollToAppt}>
                Book an appointment
              </button>
              <button className="btn-secondary" onClick={showTeam}>
                Meet the team
              </button>
            </div>
          </section>

          {/* ABOUT */}
          <section className="section about-section">
            <div className="about-card">
              <h2>Trusted care for every patient</h2>
              <p>
                Our clinic provides coordinated oncology services in a warm, welcoming environment.
                From early screening to treatment and recovery planning, our specialists are here to
                support you.
              </p>
            </div>
          </section>

          {/* DOCTORS */}
          <section className="section">
            <div className="section-header">
              <h2>Our lead doctors</h2>
              <p>Meet the specialists who guide every patient journey.</p>
            </div>
            <div className="doctor-grid">
              {doctors.slice(0, 3).map((doctor) => (
                <article key={doctor.name} className="doctor-card">
                  <div className="portrait">{doctor.initials}</div>
                  <h3 className={doctor.highlight ? 'highlight' : ''}>{doctor.name}</h3>
                  <p className="doctor-role">{doctor.role}</p>
                  <p>{doctor.bio}</p>
                </article>
              ))}
            </div>
            <div className="section-center">
              <button className="btn-secondary" onClick={showTeam}>
                View full team
              </button>
            </div>
          </section>

          {/* SERVICES */}
          <section className="section services-section">
            <div className="section-header">
              <h2>What we offer</h2>
              <p>Comprehensive care designed around your needs.</p>
            </div>
            <div className="services-grid">
              {services.map((service) => (
                <article key={service.title} className="service-card">
                  <div className="service-icon">{service.icon}</div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </article>
              ))}
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section className="section testimonials-section">
            <div className="section-header">
              <h2>Patient stories</h2>
              <p>Confidence, comfort, and successful outcomes from families like yours.</p>
            </div>
            <div className="testimonial-grid">
              {testimonials.map((item) => (
                <blockquote key={item.name} className="testimonial-card">
                  <p>"{item.quote}"</p>
                  <footer>— {item.name}</footer>
                </blockquote>
              ))}
            </div>
          </section>

          {/* APPOINTMENT */}
          <section className="section appointment-section" ref={appointmentRef}>
            <div className="appointment-card">
              <div className="appt-info">
                <h2>Schedule your visit</h2>
                <p>
                  Request an appointment and our care team will reach out to confirm your preferred
                  time.
                </p>
                <ul>
                  <li>Expert oncologists and nursing staff</li>
                  <li>Easy appointment booking</li>
                  <li>Support with insurance and referrals</li>
                </ul>
              </div>

              <form className="appt-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Phone number (for WhatsApp & Email notifications)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <select
                  value={form.doctor}
                  onChange={(e) => setForm({ ...form, doctor: e.target.value, time: '' })}
                  className="form-select"
                  required
                >
                  <option value="">Select a doctor</option>
                  {Object.keys(doctorSchedule).map((docName) => (
                    <option key={docName} value={docName}>
                      {docName}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
                {form.doctor && (
                  <div className="time-slots">
                    <p className="time-label">Available times for {form.doctor}:</p>
                    <div className="time-grid">
                      {doctorSchedule[form.doctor].timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`time-slot ${form.time === slot ? 'selected' : ''}`}
                          onClick={() => setForm({ ...form, time: slot })}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <textarea
                  placeholder="Notes (optional)"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
                {!backendReady && (
                  <p className="form-notice">⏳ Connecting to server, please wait a moment...</p>
                )}
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="book-btn" disabled={!backendReady}>
                  {backendReady ? 'Book appointment' : 'Connecting...'}
                </button>
                {submitted && (
                  <p className="form-success">Thank you! We will contact you shortly.</p>
                )}
              </form>
            </div>

            {appointments.length > 0 && (
              <div className="appointments-list">
                <h3>📅 Appointment Schedule</h3>
                <div className="schedule-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Email</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map((appt, i) => (
                          <tr key={i}>
                            <td>{appt.name}</td>
                            <td>{appt.doctor}</td>
                            <td>{new Date(appt.date).toLocaleDateString()}</td>
                            <td><strong>{appt.time}</strong></td>
                            <td>{appt.email}</td>
                            <td>{appt.phone}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* FOOTER */}
          <footer className="site-footer">
            <div>
              <h2>Oncology Clinic</h2>
              <p>Delivering thoughtful cancer care with every patient journey.</p>
            </div>
            <div className="footer-links">
              <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>About</button>
              <button type="button" onClick={() => document.querySelector('.services-section')?.scrollIntoView({ behavior: 'smooth' })}>Services</button>
              <button type="button" onClick={scrollToAppt}>Appointment</button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
