import nodemailer from "nodemailer";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to take our messages");
  }
});

export interface AppointmentEmailData {
  appointmentId: number;
  userEmail: string;
  userName: string;
  userContact: string;
  veterinarianEmail: string;
  veterinarianName: string;
  veterinarianContact: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  status?: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
}

// Send email to veterinarian when user schedules an appointment
export async function sendAppointmentNotificationToVet(
  data: AppointmentEmailData,
) {
  try {
    const mailOptions = {
      from: `"VetLink" <${process.env.SMTP_FROM_EMAIL}>`,
      to: data.veterinarianEmail,
      subject: `New Appointment Request - ${data.appointmentDate} at ${data.appointmentTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">New Appointment Request</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #34495e; margin-bottom: 15px;">Appointment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Appointment ID:</td>
                  <td style="padding: 8px 0; color: #333;">#${data.appointmentId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(data.appointmentDate).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Time:</td>
                  <td style="padding: 8px 0; color: #333;">${data.appointmentTime}</td>
                </tr>
                ${
                  data.reason
                    ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Reason:</td>
                  <td style="padding: 8px 0; color: #333;">${data.reason}</td>
                </tr>
                `
                    : ""
                }
              </table>
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #34495e; margin-bottom: 15px;">Client Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Name:</td>
                  <td style="padding: 8px 0; color: #333;">${data.userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${data.userEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Contact:</td>
                  <td style="padding: 8px 0; color: #333;">${data.userContact}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724; font-weight: bold;">
                Please log in to your VetLink dashboard to confirm or reject this appointment.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      "Appointment notification sent to veterinarian:",
      result.messageId,
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      "Error sending appointment notification to veterinarian:",
      error,
    );
    return { success: false, error: error };
  }
}

// Send email to user when veterinarian confirms or rejects appointment
export async function sendAppointmentStatusToUser(data: AppointmentEmailData) {
  try {
    const isAccepted = data.status === "accepted";
    const statusColor = isAccepted ? "#28a745" : "#dc3545";
    const statusText = isAccepted ? "Confirmed" : "Rejected";
    const statusIcon = isAccepted ? "✅" : "❌";

    const mailOptions = {
      from: `"VetLink" <${process.env.SMTP_FROM_EMAIL}>`,
      to: data.userEmail,
      subject: `Appointment ${statusText} - ${data.appointmentDate} at ${data.appointmentTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">
              ${statusIcon} Appointment ${statusText}
            </h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #34495e; margin-bottom: 15px;">Appointment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Appointment ID:</td>
                  <td style="padding: 8px 0; color: #333;">#${data.appointmentId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(data.appointmentDate).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Time:</td>
                  <td style="padding: 8px 0; color: #333;">${data.appointmentTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Status:</td>
                  <td style="padding: 8px 0; color: ${statusColor}; font-weight: bold;">${statusText}</td>
                </tr>
                ${
                  data.reason
                    ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Reason:</td>
                  <td style="padding: 8px 0; color: #333;">${data.reason}</td>
                </tr>
                `
                    : ""
                }
              </table>
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #34495e; margin-bottom: 15px;">Veterinarian Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Name:</td>
                  <td style="padding: 8px 0; color: #333;">${data.veterinarianName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${data.veterinarianEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Contact:</td>
                  <td style="padding: 8px 0; color: #333;">${data.veterinarianContact}</td>
                </tr>
              </table>
            </div>

            ${
              isAccepted
                ? `
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724; font-weight: bold;">
                Great! Your appointment has been confirmed. Please arrive 10 minutes early for your appointment.
              </p>
            </div>
            `
                : `
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545;">
              <p style="margin: 0; color: #721c24; font-weight: bold;">
                Unfortunately, your appointment request has been rejected. Please contact the veterinarian or schedule a different time slot.
              </p>
            </div>
            `
            }
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Appointment ${statusText.toLowerCase()} notification sent to user:`,
      result.messageId,
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `Error sending appointment ${data.status} notification to user:`,
      error,
    );
    return { success: false, error: error };
  }
}

// Send password reset email
export interface PasswordResetEmailData {
  email: string;
  username: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  try {
    const mailOptions = {
      from: `"VetLink" <${process.env.SMTP_FROM_EMAIL}>`,
      to: data.email,
      subject: "Reset Your VetLink Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Password Reset Request</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <p style="color: #333; line-height: 1.6;">
                Hello ${data.username},
              </p>
              <p style="color: #333; line-height: 1.6;">
                We received a request to reset your password for your VetLink account. Click the button below to reset your password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" 
                   style="display: inline-block; background: linear-gradient(to right, #2563eb, #1d4ed8); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #2563eb; font-size: 12px; word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">
                ${data.resetUrl}
              </p>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
                This link will expire in 1 hour for security reasons.
              </p>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
              <p style="margin: 0; color: #1565c0; font-size: 14px;">
                <strong>Security Tip:</strong> Never share your password reset link with anyone. VetLink will never ask for your password.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: error };
  }
}

export default transporter;
