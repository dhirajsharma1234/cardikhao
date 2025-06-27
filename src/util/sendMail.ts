/** @format */

import { transporter } from "../services/mailer";

export const sendEmail = async (
    to: string,
    subject: string,
    text: string,
    html?: string
): Promise<void> => {
    try {
        console.log({
            from: `${process.env.EMAIL_USER}`,
            to,
            subject,
            text,
            html,
        });

        await transporter.sendMail({
            from: `${process.env.EMAIL_USER}`,
            to,
            subject,
            text,
            html,
        });
        console.log(`📧 Email sent to ${to}`);
    } catch (err) {
        console.error("❌ Email sending failed:", (err as Error).message);
        throw new Error("Failed to send email.");
    }
};
