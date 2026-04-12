require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sendAppointmentNotifications } = require('./notificationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

/**
 * POST /api/appointments
 * Receive appointment booking and send notifications
 */
app.post('/api/appointments', async (req, res) => {
  try {
    const { name, email, phone, doctor, date, time, notes } = req.body;

    // Validation
    if (!name || !email || !phone || !doctor || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, phone, doctor, date, time',
      });
    }

    // Validate phone number format (basic validation)
    if (!phone.match(/^\\+?[0-9\\s\\-\\(\\)]+$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
      });
    }

    const appointmentData = {
      name,
      email,
      phone,
      doctor,
      date,
      time,
      notes: notes || '',
      bookingTime: new Date().toISOString(),
    };

    // Send notifications
    console.log('Processing appointment booking...');
    const notificationResults = await sendAppointmentNotifications(appointmentData);

    // Check if at least one notification was successful
    const whatsappSuccess = notificationResults.whatsapp?.success;
    const emailSuccess = notificationResults.email?.success;

    if (!whatsappSuccess && !emailSuccess) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send notifications',
        details: notificationResults,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully. Confirmation sent via WhatsApp and Email.',
      appointment: appointmentData,
      notifications: notificationResults,
    });
  } catch (error) {
    console.error('Error processing appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing appointment',
      error: error.message,
    });
  }
});

/**
 * GET /api/appointments
 * Retrieve all appointments (optional - for admin use)
 */
const appointments = [];

app.post('/api/appointments/store', (req, res) => {
  try {
    const appointmentData = req.body;
    appointments.push({
      ...appointmentData,
      id: appointments.length + 1,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Appointment saved',
      appointment: appointments[appointments.length - 1],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving appointment',
      error: error.message,
    });
  }
});

app.get('/api/appointments', (req, res) => {
  res.json({
    success: true,
    appointments,
    total: appointments.length,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\\n🚀 OncoHealth Backend Server is running on port ${PORT}`);
  console.log(`📧 Email notifications: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
  console.log(`📱 WhatsApp notifications: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not configured'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\\n`);
});

module.exports = app;
