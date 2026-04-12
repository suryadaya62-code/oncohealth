# OncoHealth Project Setup

This project consists of a React frontend and a Node.js backend for managing patient appointments with automated WhatsApp and email notifications.

## Project Structure

```
oncohealth/
├── src/                 (React frontend)
│   ├── App.js
│   ├── App.css
│   ├── Team.js
│   ├── data/
│   │   └── doctors.js
│   ├── index.js
│   └── index.css
├── backend/             (Node.js Express server)
│   ├── server.js
│   ├── notificationService.js
│   ├── package.json
│   └── .env.example
├── public/
├── build/
└── package.json
```

## Quick Start

### Option 1: Run Backend Only (Terminal 1)

```bash
cd backend
npm install
cp .env.example .env
# Configure .env with Twilio and Gmail credentials
npm run dev
```

### Option 2: Run Frontend Only (Terminal 2)

```bash
npm install
npm start
```

This will open the React app at `http://localhost:3000`

### Option 3: Run Both (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Add your Twilio Account SID, Auth Token, and Gmail credentials to .env
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm install
npm start
```

## Setup Steps

### 1. Configure Backend Environment

Navigate to `backend/.env` and add your credentials:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Gmail Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 2. Get Twilio Credentials

1. Sign up at [Twilio.com](https://www.twilio.com)
2. Go to Console > Account info
3. Copy Account SID and Auth Token
4. Set up WhatsApp messaging and get your WhatsApp number

### 3. Get Gmail Credentials

1. Enable 2-Factor Authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for Gmail
4. Use this in EMAIL_PASSWORD

See [backend/README.md](./backend/README.md) for detailed setup instructions.

## Running the Application

### Development

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
npm start
```

Visit `http://localhost:3000` in your browser.

### Production Build

```bash
npm run build
```

This creates a `build/` folder with optimized production files.

## Testing the Appointment System

1. Open http://localhost:3000
2. Click "Book appointment"
3. Fill in the form:
   - Full name
   - Email
   - Phone number (with country code, e.g., +1234567890)
   - Appointment date
   - Notes (optional)
4. Click "Book appointment"
5. Check your email and WhatsApp for confirmation

## API Reference

### Health Check
```
GET http://localhost:5000/api/health
```

### Book Appointment
```
POST http://localhost:5000/api/appointments
Content-Type: application/json

{
  "name": "Patient Name",
  "email": "patient@example.com",
  "phone": "+1234567890",
  "date": "2026-05-15",
  "notes": "Optional"
}
```

### Get All Appointments
```
GET http://localhost:5000/api/appointments
```

## Troubleshooting

### Backend not starting
- Check if port 5000 is available
- Verify Node.js is installed (`node --version`)
- Check for errors in terminal output

### Frontend not connecting to backend
- Ensure backend is running on http://localhost:5000
- Check CORS settings in backend/server.js
- Verify FRONTEND_URL in .env matches your frontend URL

### Notifications not sending
- For WhatsApp: Verify Twilio credentials and phone format
- For Email: Check Gmail app password and verify 2FA is enabled
- Check terminal logs for error messages

## Features

✅ Doctor profiles and team directory
✅ Appointment booking form
✅ WhatsApp notifications via Twilio
✅ Email notifications via Gmail
✅ Responsive design
✅ Patient data validation

## Technologies Used

### Frontend
- React 18.2
- CSS3
- React Hooks

### Backend
- Node.js
- Express.js
- Twilio SDK
- Nodemailer
- CORS middleware

## Next Steps

1. Deploy frontend to Vercel/Netlify
2. Deploy backend to Heroku/Render/AWS
3. Set up production environment variables
4. Customize notification messages
5. Add database integration for persistent storage

## Support

For issues or questions:
1. Check [backend/README.md](./backend/README.md)
2. Review terminal logs for error messages
3. Verify all environment variables are set correctly

---
Last Updated: April 2026
