import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. Emails will not be sent.')
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOTPEmail(to: string, otp: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Sending OTP ${otp} to ${to}`)
    return
  }

  await resend.emails.send({
    from: process.env.OTP_FROM_EMAIL || 'onboarding@resend.dev',
    to,
    subject: `Your Clinic POS Login Code: ${otp}`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto">
        <h2>🏥 Clinic POS — Verification Code</h2>
        <p>Your one-time login code:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;
                    background:#f1f5f9;padding:16px;text-align:center;
                    border-radius:8px;font-family:monospace">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:12px">
          Valid for 5 minutes. Do not share this code with anyone.
        </p>
      </div>
    `
  })
}
