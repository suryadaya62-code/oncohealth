require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { sendAppointmentNotifications } = require('./notificationService');
const { generateText } = require('./aiService');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from React build
const buildPath = path.resolve(__dirname, '../build');
console.log('📁 Looking for build folder at:', buildPath);
console.log('📁 Build folder exists:', fs.existsSync(buildPath));

if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  console.log('✅ Static file serving enabled');
} else {
  console.warn('⚠️  Build folder not found - static files will not be served');
}

// Allowed origins: localhost for dev + any HTTPS origin for production (Netlify, etc.)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

// Middleware - CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow localhost and any HTTPS origin (covers all Netlify/custom domains)
    if (allowedOrigins.includes(origin) || origin.startsWith('https://')) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Origin not allowed - ' + origin));
  },
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Keep-alive ping (called by frontend to wake up Render on first load)
app.get('/api/ping', (req, res) => {
  res.json({ pong: true, timestamp: new Date().toISOString() });
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
    if (!phone.match(/^\+?[0-9\s\-\(\)]+$/)) {
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

    // Send notifications (best-effort — booking succeeds even if notifications fail)
    console.log('Processing appointment booking...');
    let notificationResults = { whatsapp: null, email: null };
    try {
      notificationResults = await sendAppointmentNotifications(appointmentData);
    } catch (notifError) {
      console.warn('Notification sending failed (non-blocking):', notifError.message);
    }

    const whatsappSuccess = notificationResults.whatsapp?.success;
    const emailSuccess = notificationResults.email?.success;

    // Log notification failures but don't block the booking
    if (!whatsappSuccess && !emailSuccess) {
      console.warn('Both notifications failed — booking still saved.');
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.' +
        (whatsappSuccess || emailSuccess ? ' Confirmation sent.' : ' Notifications could not be sent, but your appointment is saved.'),
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

/**
 * POST /api/ai/chat
 * Endpoint to interact with Google AI Studio (Gemini)
 */
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }
    
    const responseText = await generateText(prompt);
    res.json({ success: true, response: responseText });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to Google AI Studio', 
      error: error.message 
    });
  }
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

// Catch-all: Serve React app for any route not matched (client-side routing)
app.get('*', (req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      success: false,
      message: 'Frontend not available - build folder missing or index.html not found',
      buildPath: buildPath,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 OncoHealth Backend Server is running on port ${PORT}`);
  console.log(`📧 Email notifications: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
  console.log(`📱 WhatsApp notifications: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not configured'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
});

module.exports = app;
