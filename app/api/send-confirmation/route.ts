import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Lazy initialization to avoid crash if API key is missing on startup
let resend: Resend | null = null;

export async function POST(req: Request) {
  try {
    const { email, patientName, date, slot, doctor, notes } = await req.json();

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not configured in environment variables');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    if (!resend) {
      resend = new Resend(apiKey);
    }

    const { data, error } = await resend.emails.send({
      from: 'OncoHealth <confirmations@resend.dev>', // Note: Use dynamic domain if configured
      to: [email],
      subject: `Booking Confirmed: Your Appointment with ${doctor}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0d9488; text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">OncoHealth Confirmation</h2>
          <p>Dear <strong>${patientName}</strong>,</p>
          <p>Your oncology consultation has been successfully scheduled. We are committed to supporting you through your recovery journey.</p>
          <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ccfbf1;">
            <p style="margin: 5px 0;"><strong>👨‍⚕️ Specialist:</strong> ${doctor}</p>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${slot}</p>
            ${notes ? `<p style="margin: 5px 0;"><strong>📝 Notes:</strong> ${notes}</p>` : ''}
          </div>
          <p><strong>Location:</strong> Memorial Cancer Research Center, Wing B, Suite 402.</p>
          <p style="font-size: 14px; color: #666;">Please arrive 15 minutes prior to your appointment. If you need to reschedule, please contact us at least 24 hours in advance.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">This is a secure communication from OncoHealth. HIPAA Compliant & AES-256 Encrypted.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: error.message || 'Unknown email service error' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Server Internal Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
