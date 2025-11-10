import { must } from "@/shared/must";
import { Resend } from "resend";

const resendApiKey = must(
  process.env.RESEND_API_KEY,
  "RESEND_API_KEY must be set",
);
const resend = new Resend(resendApiKey);

export interface InvitationEmailData {
  to: string;
  inviterName: string;
  listName: string;
  acceptUrl: string;
  declineUrl: string;
}

export interface VerificationEmailData {
  to: string;
  type: "verify-email" | "reset-password";
  verificationUrl: string;
  userName: string;
}

export async function sendInvitationEmail(data: InvitationEmailData) {
  const { to, inviterName, listName, acceptUrl, declineUrl } = data;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JOIN THE GROCERY DESTRUCTION</title>
      </head>
      <body style="font-family: 'Courier New', monospace; margin: 0; padding: 0; background-color: #f9f9f9;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 8px solid #000000; box-shadow: 12px 12px 0px 0px #f97316;">
                <tr>
                  <td style="padding: 40px 30px;">
                    <!-- Header -->
                    <h1 style="font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #000000; margin: 0 0 20px 0; text-align: center; font-family: 'Courier New', monospace;">
                      GROCERY DESTRUCTION INVITATION
                    </h1>

                    <!-- Subheader -->
                    <p style="font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666666; margin: 0 0 30px 0; text-align: center; font-family: 'Courier New', monospace;">
                      ${inviterName.toUpperCase()} WANTS YOU TO JOIN THEIR MISSION
                    </p>

                    <!-- Content -->
                    <div style="text-align: center; margin: 40px 0;">
                      <p style="font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000000; margin: 0 0 20px 0; font-family: 'Courier New', monospace;">
                        LIST: ${listName.toUpperCase()}
                      </p>

                      <p style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666666; margin: 0 0 40px 0; line-height: 1.6; font-family: 'Courier New', monospace;">
                        TIME TO CRUSH SOME GROCERIES TOGETHER.<br>
                        ACCEPT THIS INVITATION TO BECOME A COLLABORATOR.
                      </p>
                    </div>

                    <!-- Action Buttons -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 0 10px;">
                                <a href="${acceptUrl}" style="display: inline-block; padding: 16px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; font-weight: 900; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; border: 4px solid #000000; box-shadow: 6px 6px 0px 0px #000000; font-family: 'Courier New', monospace;">
                                  ACCEPT INVITATION
                                </a>
                              </td>
                              <td style="padding: 0 10px;">
                                <a href="${declineUrl}" style="display: inline-block; padding: 16px 32px; background-color: #ffffff; color: #000000; text-decoration: none; font-weight: 900; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; border: 4px solid #000000; box-shadow: 6px 6px 0px 0px #666666; font-family: 'Courier New', monospace;">
                                  DECLINE
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 4px solid #000000;">
                      <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666666; margin: 0; font-family: 'Courier New', monospace;">
                        THIS INVITATION WILL EXPIRE IN 7 DAYS
                      </p>
                      <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666666; margin: 10px 0 0 0; font-family: 'Courier New', monospace;">
                        IF YOU DIDN'T EXPECT THIS, YOU CAN SAFELY IGNORE IT
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
GROCERY DESTRUCTION INVITATION

${inviterName.toUpperCase()} WANTS YOU TO JOIN THEIR MISSION

LIST: ${listName.toUpperCase()}

TIME TO CRUSH SOME GROCERIES TOGETHER.
ACCEPT THIS INVITATION TO BECOME A COLLABORATOR.

ACCEPT: ${acceptUrl}
DECLINE: ${declineUrl}

THIS INVITATION WILL EXPIRE IN 7 DAYS
IF YOU DIDN'T EXPECT THIS, YOU CAN SAFELY IGNORE IT
  `.trim();

  return resend.emails.send({
    from: "Grokeries <invitations@gasberg.me>",
    to: [to],
    subject: `JOIN ${inviterName.toUpperCase()}'S GROCERY DESTRUCTION MISSION`,
    html,
    text,
  });
}

export async function sendVerificationEmail(data: VerificationEmailData) {
  const { to, type, verificationUrl, userName } = data;

  const isVerification = type === "verify-email";
  const title = isVerification ? "VERIFY YOUR EMAIL" : "RESET YOUR PASSWORD";
  const actionText = isVerification ? "VERIFY EMAIL" : "RESET PASSWORD";
  const description = isVerification
    ? "CLICK THE BUTTON BELOW TO VERIFY YOUR EMAIL AND START DESTROYING GROCERIES."
    : "CLICK THE BUTTON BELOW TO RESET YOUR PASSWORD AND CONTINUE YOUR GROCERY DESTRUCTION MISSION.";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: 'Courier New', monospace; margin: 0; padding: 0; background-color: #f9f9f9;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 8px solid #000000; box-shadow: 12px 12px 0px 0px #f97316;">
                <tr>
                  <td style="padding: 40px 30px;">
                    <!-- Header -->
                    <h1 style="font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #000000; margin: 0 0 20px 0; text-align: center; font-family: 'Courier New', monospace;">
                      ${title}
                    </h1>

                    <!-- Greeting -->
                    <p style="font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666666; margin: 0 0 30px 0; text-align: center; font-family: 'Courier New', monospace;">
                      HEY ${userName.toUpperCase()}!
                    </p>

                    <!-- Content -->
                    <div style="text-align: center; margin: 40px 0;">
                      <p style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666666; margin: 0 0 40px 0; line-height: 1.6; font-family: 'Courier New', monospace;">
                        ${description}
                      </p>
                    </div>

                    <!-- Action Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; font-weight: 900; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; border: 4px solid #000000; box-shadow: 6px 6px 0px 0px #000000; font-family: 'Courier New', monospace;">
                            ${actionText}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Alternative Link -->
                    <div style="text-align: center; margin-top: 30px;">
                      <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666666; margin: 0 0 10px 0; font-family: 'Courier New', monospace;">
                        OR COPY THIS LINK:
                      </p>
                      <p style="font-size: 11px; font-weight: 400; color: #666666; margin: 0; font-family: 'Courier New', monospace; word-break: break-all;">
                        ${verificationUrl}
                      </p>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 4px solid #000000;">
                      <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666666; margin: 0; font-family: 'Courier New', monospace;">
                        THIS LINK WILL EXPIRE IN 24 HOURS
                      </p>
                      <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666666; margin: 10px 0 0 0; font-family: 'Courier New', monospace;">
                        IF YOU DIDN'T REQUEST THIS, YOU CAN SAFELY IGNORE IT
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
${title}

HEY ${userName.toUpperCase()}!

${description}

${actionText}: ${verificationUrl}

THIS LINK WILL EXPIRE IN 24 HOURS
IF YOU DIDN'T REQUEST THIS, YOU CAN SAFELY IGNORE IT
  `.trim();

  console.log("Sending verification email to:", to);

  return resend.emails.send({
    from: "Grokeries <noreply@gasberg.me>",
    to: [to],
    subject: title,
    html,
    text,
  });
}
