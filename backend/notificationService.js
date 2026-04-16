const twilio = require('twilio');
const nodemailer = require('nodemailer');

// Initialize Twilio client (only if credentials are available)
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Configure email transporter (only if credentials are available)
const emailTransporter = (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  : null;

/**
 * Send WhatsApp notification via Twilio
 * @param {string} phoneNumber - Patient phone number (with country code, e.g., +1234567890)
 * @param {object} appointmentData - Appointment details
 */
async function sendWhatsAppNotification(phoneNumber, appointmentData) {
  if (!twilioClient) {
    console.log('WhatsApp notifications not configured (missing Twilio credentials)');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const message = `
Hello ${appointmentData.name},

Your appointment has been confirmed!

📅 Date: ${new Date(appointmentData.date).toLocaleDateString()}
🕐 Time: ${appointmentData.time}
👨‍⚕️ Doctor: ${appointmentData.doctor}
🏥 Clinic: OncoHealth Oncology Clinic
📝 Notes: ${appointmentData.notes || 'No additional notes'}

We look forward to seeing you soon. If you need to reschedule, please reply to this message.

Best regards,
OncoHealth Team
    `.trim();

    const response = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      body: message,
    });

    console.log(`WhatsApp sent successfully to ${phoneNumber}. SID: ${response.sid}`);
    return { success: true, messageId: response.sid };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email notification
 * @param {string} email - Patient email address
 * @param {object} appointmentData - Appointment details
 */
async function sendEmailNotification(email, appointmentData) {
  if (!emailTransporter) {
    console.log('Email notifications not configured (missing email credentials)');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Appointment Confirmation - OncoHealth Clinic',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { padding: 20px; background-color: white; }
    .details { margin: 15px 0; }
    .detail-item { padding: 10px; border-left: 4px solid #4CAF50; margin: 10px 0; background-color: #f0f8f0; }
    .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appointment Confirmation</h1>
    </div>
    <div class="content">
      <p>Dear ${appointmentData.name},</p>
      <p>Thank you for scheduling your appointment with us!</p>

      <div class="details">
        <div class="detail-item">
          <strong>📅 Appointment Date:</strong> ${new Date(appointmentData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div class="detail-item">
          <strong>🕐 Time:</strong> ${appointmentData.time}
        </div>
        <div class="detail-item">
          <strong>👨‍⚕️ Doctor:</strong> ${appointmentData.doctor}
        </div>
        <div class="detail-item">
          <strong>🏥 Clinic:</strong> OncoHealth Oncology Clinic
        </div>
        <div class="detail-item">
          <strong>📱 Your Phone:</strong> ${appointmentData.phone}
        </div>
        ${appointmentData.notes ? `<div class="detail-item"><strong>📝 Notes:</strong> ${appointmentData.notes}</div>` : ''}
      </div>

      <p>Our care team will reach out to you shortly to confirm the details and answer any questions you may have.</p>

      <p>If you need to reschedule or have any concerns, please don't hesitate to contact us.</p>

      <p>Best regards,<br><strong>OncoHealth Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated confirmation email. Please do not reply to this email.</p>
      <p>&copy; 2026 OncoHealth Clinic. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
    };

    const response = await emailTransporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}. Response: ${response.messageId}`);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send both WhatsApp and email notifications
 * @param {object} appointmentData - Full appointment details
 */
async function sendAppointmentNotifications(appointmentData) {
  console.log('Sending appointment notifications for:', appointmentData.name);

  const results = {
    whatsapp: null,
    email: null,
  };

  // Send WhatsApp notification
  if (appointmentData.phone) {
    results.whatsapp = await sendWhatsAppNotification(appointmentData.phone, appointmentData);
  }

  // Send Email notification
  if (appointmentData.email) {
    results.email = await sendEmailNotification(appointmentData.email, appointmentData);
  }

  return results;
}

module.exports = {
  sendWhatsAppNotification,
  sendEmailNotification,
  sendAppointmentNotifications,
};
