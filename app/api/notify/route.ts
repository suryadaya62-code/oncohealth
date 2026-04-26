import { Resend } from 'resend';
import twilio from 'twilio';
import { NextResponse } from 'next/server';

let resend: Resend | null = null;
let twilioClient: any = null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Ruthless Input Validation & Length Limits
    const { email, phone, patientName, date, slot, doctor, notes } = body;
    
    const sanitize = (str: any) => String(str || '').replace(/[<>]/g, '').trim().substring(0, 500);
    const sName = sanitize(patientName).substring(0, 100);
    const sDoctor = sanitize(doctor).substring(0, 100);
    const sDate = sanitize(date).substring(0, 50);
    const sSlot = sanitize(slot).substring(0, 50);
    const sPhone = sanitize(phone).substring(0, 20);
    const sNotes = sanitize(notes).substring(0, 1000);
    const sEmail = String(email || '').toLowerCase().trim().substring(0, 255);

    if (!sName || !sEmail || !sDoctor) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Basic email regex
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    const results: any = { email: { status: 'skipped' }, sms: { status: 'skipped' } };

    // 2. Handle Email (Resend)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        if (!resend) resend = new Resend(resendKey);
        
        // Patient Confirmation
        const patientEmail = resend.emails.send({
          from: 'OncoHealth <confirmations@resend.dev>',
          to: [sEmail],
          subject: `Booking Confirmed: ${sDoctor}`,
          html: `<div style="font-family: sans-serif;"><h2>Confirmed</h2><p>Dear ${sName}, your appointment with ${sDoctor} is scheduled for ${sDate} at ${sSlot}.</p></div>`
        });

        // Admin Notification
        const adminEmail = resend.emails.send({
          from: 'OncoHealth Admin <notifications@resend.dev>',
          to: ['Suryadaya62@gmail.com'],
          subject: `New Patient Booking: ${sName}`,
          html: `
            <div style="font-family: sans-serif;">
              <h2 style="color: #2c3e50;">New Appointment Details</h2>
              <p><strong>Patient:</strong> ${sName}</p>
              <p><strong>Contact:</strong> ${sPhone || 'N/A'}</p>
              <p><strong>Email:</strong> ${sEmail}</p>
              <p><strong>Specialist:</strong> ${sDoctor}</p>
              <p><strong>Schedule:</strong> ${sDate} at ${sSlot}</p>
              <p><strong>Notes:</strong> ${sNotes || 'None provided'}</p>
              <hr />
              <p style="font-size: 11px; color: #7f8c8d;">This is an automated notification from OncoHealth Patient Portal.</p>
            </div>
          `
        });

        const { error } = await patientEmail; 
        await adminEmail; 
        
        if (error) throw new Error(error.message);
        results.email = { status: 'success' };
      } catch (err: any) {
        console.error('Email failed:', err);
        results.email = { status: 'error', message: 'Notification service unavailable' };
      }
    }

  // 2. Handle SMS/WhatsApp (Twilio)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  let twilioSender = process.env.TWILIO_SENDER;

  if (twilioSid && twilioToken && twilioSender && phone) {
    try {
      if (!twilioClient) twilioClient = twilio(twilioSid, twilioToken);
      
      // Auto-fix for common WhatsApp sandbox number if prefix is missing
      if (twilioSender.trim() === '+14155238886') {
        twilioSender = 'whatsapp:+14155238886';
      }

      const isWhatsApp = twilioSender.startsWith('whatsapp:');
      
      // Format number to E.164 (Assuming +91 for 10-digit numbers often used in this app's context)
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.length === 10) {
          formattedPhone = `+91${formattedPhone}`;
        } else if (formattedPhone.length === 12 && formattedPhone.startsWith('91')) {
          formattedPhone = `+${formattedPhone}`;
        }
      }

      await twilioClient.messages.create({
        body: `OncoHealth: Hi ${patientName}, your appt with ${doctor} is confirmed for ${date} @ ${slot}.`,
        from: twilioSender,
        to: isWhatsApp ? `whatsapp:${formattedPhone}` : formattedPhone
      });
      results.sms = { status: 'success' };
    } catch (err: any) {
      console.error('SMS failed:', err);
      let msg = err.message || 'Twilio error';
      if (err.code === 21606 || err.code === 21660) {
        msg = `Number Mismatch: Use 'whatsapp:${twilioSender}' if using WhatsApp Sandbox, or check if number is bought in Twilio Console.`;
      }
      results.sms = { status: 'error', message: msg };
    }
  } else if (!twilioSid && phone) {
    results.sms = { status: 'error', message: 'TWILIO credentials missing' };
  }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('Unified notify failure:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal notification error' }, { status: 500 });
  }
}
