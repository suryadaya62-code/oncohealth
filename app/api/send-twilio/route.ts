import twilio from 'twilio';
import { NextResponse } from 'next/server';

let twilioClient: any = null;

export async function POST(req: Request) {
  try {
    const { phone, patientName, date, slot, doctor } = await req.json();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const sender = process.env.TWILIO_SENDER;

    if (!accountSid || !authToken || !sender) {
      console.error('Twilio credentials not configured');
      return NextResponse.json({ error: 'Twilio service not configured' }, { status: 500 });
    }

    if (!twilioClient) {
      twilioClient = twilio(accountSid, authToken);
    }

    const isWhatsApp = sender.startsWith('whatsapp:');
    const to = isWhatsApp ? `whatsapp:${phone}` : phone;

    const message = `Hello ${patientName}, your appointment with ${doctor} at OncoHealth is confirmed for ${date} at ${slot}. We look forward to seeing you. Contact: Memorial Cancer Research Center.`;

    const response = await twilioClient.messages.create({
      body: message,
      from: sender,
      to: to,
    });

    return NextResponse.json({ success: true, messageId: response.sid });
  } catch (err) {
    console.error('Twilio API Error:', err);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
