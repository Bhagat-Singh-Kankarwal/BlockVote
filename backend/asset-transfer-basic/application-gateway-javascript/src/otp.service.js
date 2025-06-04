const nodemailer = require('nodemailer');
require('dotenv').config();

class OtpService {
    constructor() {
        // Store OTPs with expiration (in-memory storage)
        this.otpStore = {};

        // Configure nodemailer
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Generate a 6-digit OTP
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Store OTP for a user with 10-minute expiration
    storeOtp(userId, email) {
        const otp = this.generateOtp();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        this.otpStore[userId] = {
            otp,
            email,
            expiresAt
        };

        // Setup automatic cleanup after expiration
        setTimeout(() => {
            if (this.otpStore[userId] && this.otpStore[userId].otp === otp) {
                delete this.otpStore[userId];
            }
        }, 10 * 60 * 1000);

        return otp;
    }

    // Verify an OTP for a user
    verifyOtp(userId, inputOtp) {
        const record = this.otpStore[userId];

        if (!record) {
            return { valid: false, message: 'OTP not found or expired' };
        }

        if (Date.now() > record.expiresAt) {
            delete this.otpStore[userId];
            return { valid: false, message: 'OTP expired' };
        }

        if (record.otp !== inputOtp) {
            return { valid: false, message: 'Invalid OTP' };
        }

        // OTP is valid, remove it after successful verification
        delete this.otpStore[userId];
        return {
            valid: true,
            message: 'OTP verified successfully',
            email: record.email
        };
    }

    // Send OTP email
    async sendOtpEmail(email, otp) {
        const mailOptions = {
            from: '"BlockVote" <noreply@blockvote.live>',
            to: email,
            subject: 'BlockVote: Your Election Registration OTP',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>BlockVote Verification</title>

                </head>
                <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Quicksand', Arial, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td style="padding: 20px 0;">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                    <!-- Header with gradient -->
                                    <tr>
                                        <td style="background: linear-gradient(to right, #4A6FA5, #6B46C1); padding: 30px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-weight: 600; font-size: 24px;">BlockVote</h1>
                                        </td>
                                    </tr>
                                    
                                    <!-- Body content -->
                                    <tr>
                                        <td style="padding: 30px;">
                                            <h2 style="color: #1e293b; font-weight: 600; margin-top: 0;">Verify Your Email</h2>
                                            <p style="color: #475569; line-height: 1.5; margin-bottom: 24px;">To continue with your election registration, please use the verification code below:</p>
                                            
                                            <!-- OTP code box -->
                                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                                                <h1 style="font-family: monospace; font-size: 32px; letter-spacing: 6px; color: #4A6FA5; margin: 0;">${otp}</h1>
                                            </div>
                                            
                                            <p style="color: #475569; line-height: 1.5;">This code will expire in <strong>10 minutes</strong>. If you didn't request this code, you can safely ignore this email.</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                                            <p style="color: #64748b; font-size: 12px; margin: 0;">This is an automated message, please do not reply.</p>
                                            <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">© ${new Date().getFullYear()} BlockVote. All rights reserved.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending OTP email:', error);
            return false;
        }
    }
}

module.exports = new OtpService();