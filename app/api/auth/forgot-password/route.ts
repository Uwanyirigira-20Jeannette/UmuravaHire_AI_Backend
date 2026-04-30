import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return NextResponse.json(
        { message: 'If email exists, reset link was sent' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save to database (expires in 1 hour)
    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await resend.emails.send({
      from: 'UmuravaHire <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your UmuravaHire password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f5f5f5; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
              .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
              .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 4px; margin: 20px 0; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0; color: #007bff;">UmuravaHire</h2>
              </div>
              <div class="content">
                <p>Hello ${user.name},</p>
                <p>We received a request to reset the password for your UmuravaHire account. Click the button below to create a new password:</p>
                
                <center>
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </center>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">
                  ${resetUrl}
                </p>
                
                <div class="warning">
                  <strong>⚠️ Important:</strong> This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                </div>
                
                <p>Best regards,<br/>The UmuravaHire Team</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 UmuravaHire. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ message: 'Reset link sent' }, { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
