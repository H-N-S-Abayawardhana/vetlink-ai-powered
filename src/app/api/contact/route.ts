import { NextRequest, NextResponse } from "next/server";
import transporter from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Send email to admin/company
    const adminEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    if (!adminEmail) {
      console.error("SMTP_FROM_EMAIL or SMTP_USER not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 },
      );
    }

    const mailOptions = {
      from: `"VetLink Contact Form" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: adminEmail,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #14b8a6 100%); padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
            <h2 style="color: white; margin: 0;">New Contact Form Submission</h2>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #34495e; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Contact Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 8px 0; color: #333;">
                  <a href="mailto:${email}" style="color: #6366f1; text-decoration: none;">${email}</a>
                </td>
              </tr>
            </table>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #34495e; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Message</h3>
            <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          </div>

          <div style="background-color: #e0e7ff; padding: 15px; border-radius: 6px; border-left: 4px solid #6366f1; margin-top: 20px;">
            <p style="margin: 0; color: #4338ca; font-weight: bold;">
              💡 You can reply directly to this email to respond to ${name}.
            </p>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}

Message:
${message}

---
You can reply to this email to respond to ${name}.
      `,
    };

    // Send confirmation email to user
    const userConfirmationOptions = {
      from: `"VetLink" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: "Thank you for contacting VetLink",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #14b8a6 100%); padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; text-align: center;">
            <h2 style="color: white; margin: 0;">Thank You, ${name}!</h2>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #333; line-height: 1.6; margin: 0 0 15px 0;">
              We've received your message and our team will get back to you as soon as possible, typically within 24 hours.
            </p>
            <p style="color: #333; line-height: 1.6; margin: 0;">
              Your message:
            </p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin-top: 10px; border-left: 4px solid #6366f1;">
              <p style="color: #475569; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>

          <div style="background-color: #e0fdf4; padding: 15px; border-radius: 6px; border-left: 4px solid #14b8a6; margin-top: 20px;">
            <p style="margin: 0; color: #0f766e; font-weight: bold;">
              🐾 In the meantime, feel free to explore our AI-powered pet healthcare features!
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              This is an automated confirmation. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
Thank You, ${name}!

We've received your message and our team will get back to you as soon as possible, typically within 24 hours.

Your message:
${message}

In the meantime, feel free to explore our AI-powered pet healthcare features!

---
This is an automated confirmation. Please do not reply to this email.
      `,
    };

    // Send both emails
    const [adminResult, userResult] = await Promise.all([
      transporter.sendMail(mailOptions),
      transporter.sendMail(userConfirmationOptions),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been sent successfully!",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error sending contact form email:", error);
    return NextResponse.json(
      {
        error: "Failed to send message. Please try again later.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
