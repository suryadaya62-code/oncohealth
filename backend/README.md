# OncoHealth Backend - Appointment Notification System

This backend service handles appointment bookings and sends automatic notifications via WhatsApp and Email.

## Features

- 📱 **WhatsApp Notifications** via Twilio
- 📧 **Email Notifications** via Nodemailer
- ✅ **Appointment Validation**
- 🔄 **CORS Support** for React frontend
- 📊 **Appointment Storage** (in-memory)

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Twilio Account (for WhatsApp)
- Gmail Account (for email notifications)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file** (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

## Configuration

### 1. Set Up Twilio (WhatsApp Notifications)

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Create a Twilio account or sign in
3. Copy your **Account SID** and **Auth Token**
4. Set up WhatsApp integration:
   - Navigate to **Messaging > Send & Receive > Messaging Services**
   - Find or create a Messaging Service
   - Get your **Twilio WhatsApp Number** (format: +1234567890)

5. **Update `.env` file:**
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+your_whatsapp_number
   ```

### 2. Set Up Email (Gmail)

1. Go to [Google Account](https://myaccount.google.com)
2. Enable 2-Factor Authentication
3. Create an [App Password](https://support.google.com/accounts/answer/185833):
   - Account > Security > App passwords
   - Select Mail and Windows Computer
   - Generate and copy the app password

4. **Update `.env` file:**
   ```env
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=noreply@oncohealth.com
   ```

### 3. Configure Frontend URL

Update the frontend URL in `.env`:
```env
FRONTEND_URL=http://localhost:3000
```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```
Response:
```json
{ "status": "Backend is running" }
```

### Book Appointment
```
POST /api/appointments
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "date": "2026-04-20",
  "notes": "Optional notes"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Appointment booked successfully. Confirmation sent via WhatsApp and Email.",
  "appointment": { ... },
  "notifications": {
    "whatsapp": { "success": true, "messageId": "..." },
    "email": { "success": true, "messageId": "..." }
  }
}
```

### Get All Appointments
```
GET /api/appointments
```

Response:
```json
{
  "success": true,
  "appointments": [ ... ],
  "total": 5
}
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account ID | `AC1234567890abcdef1234567890abcd` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `your_auth_token` |
| `TWILIO_PHONE_NUMBER` | WhatsApp Number | `+1234567890` |
| `EMAIL_USER` | Gmail address | `clinic@gmail.com` |
| `EMAIL_PASSWORD` | Gmail App Password | `abcd efgh ijkl mnop` |
| `EMAIL_FROM` | Sender email | `noreply@oncohealth.com` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `FRONTEND_URL` | React app URL | `http://localhost:3000` |

## Troubleshooting

### WhatsApp not sending
- ✅ Verify Twilio Account SID and Auth Token are correct
- ✅ Check WhatsApp phone number format (include country code)
- ✅ Ensure phone number is in international format (+1234567890)

### Email not sending
- ✅ Verify Gmail address and app password are correct
- ✅ Ensure 2-Factor Authentication is enabled on Gmail
- ✅ Check that `EMAIL_FROM` is set correctly

### Port already in use
```bash
# Change port in .env
PORT=5001
```

## Project Structure

```
backend/
├── server.js                (Main Express app)
├── notificationService.js   (Twilio & Email logic)
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Security Notes

- Never commit `.env` file to git
- Keep `TWILIO_AUTH_TOKEN` and email passwords confidential
- Use environment variables for all sensitive data
- Validate all incoming requests
- Implement rate limiting in production

## Deployment

For production deployment:

1. Use a service like Heroku, Render, or AWS
2. Set all environment variables in the hosting platform
3. Change `NODE_ENV=production` in environment
4. Update `FRONTEND_URL` to your production domain

## Support

For issues with:
- **Twilio**: [Twilio Docs](https://www.twilio.com/docs)
- **Nodemailer**: [Nodemailer Docs](https://nodemailer.com/)
- **Express**: [Express Docs](https://expressjs.com/)

---
Created for OncoHealth Clinic | 2026
