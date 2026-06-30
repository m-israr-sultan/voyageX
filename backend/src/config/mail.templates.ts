type OtpPurpose = 'EMAIL_VERIFICATION' | 'RESET_PASSWORD' | string;

function purposeCopy(purpose: OtpPurpose): { subject: string; headline: string; body: string } {
  switch (purpose) {
    case 'EMAIL_VERIFICATION':
      return {
        subject: 'Verify your VoyageX account',
        headline: 'Verify your email address',
        body: 'Use the verification code below to complete your VoyageX registration.',
      };
    case 'RESET_PASSWORD':
      return {
        subject: 'Reset your VoyageX password',
        headline: 'Password reset code',
        body: 'Use the code below to reset your VoyageX account password. This code expires in 10 minutes.',
      };
    default:
      return {
        subject: 'Your VoyageX verification code',
        headline: 'Verification code',
        body: 'Use the code below to continue with your VoyageX account.',
      };
  }
}

export function buildOtpEmailContent(
  otp: string,
  purpose: OtpPurpose,
  fromName: string,
): { subject: string; html: string; text: string } {
  const copy = purposeCopy(purpose);

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;">
            <tr>
              <td style="padding-bottom:16px;font-size:24px;font-weight:700;color:#0f766e;">${fromName}</td>
            </tr>
            <tr>
              <td style="font-size:20px;font-weight:600;padding-bottom:12px;">${copy.headline}</td>
            </tr>
            <tr>
              <td style="font-size:15px;line-height:1.6;padding-bottom:24px;">${copy.body}</td>
            </tr>
            <tr>
              <td align="center" style="padding:20px;background:#ecfdf5;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:6px;color:#065f46;">${otp}</td>
            </tr>
            <tr>
              <td style="padding-top:24px;font-size:13px;line-height:1.6;color:#6b7280;">
                If you did not request this email, you can safely ignore it.
                <br />
                Need help? Visit <a href="https://voyagextravel.com" style="color:#0f766e;">voyagextravel.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${fromName}

${copy.headline}

${copy.body}

Your verification code: ${otp}

If you did not request this email, you can safely ignore it.
https://voyagextravel.com`;

  return {
    subject: copy.subject,
    html,
    text,
  };
}
