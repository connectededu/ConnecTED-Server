import nodemailer from 'nodemailer';

// Email templates
const templates = {
  accountApproved: (name: string) => ({
    subject: 'Your Connected Account Has Been Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to Connected!</h1>
        <p>Hi ${name},</p>
        <p>Great news! Your account has been approved by an administrator.</p>
        <p>You can now log in and access all features of the Connected platform.</p>
        <a href="${process.env.LOCALHOST_URL}" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Log In Now
        </a>
        <p style="color: #666; font-size: 14px;">
          If you have any questions, please contact your school administrator.
        </p>
      </div>
    `,
  }),

  newRegistration: (userName: string, userRole: string) => ({
    subject: 'New User Registration Pending Approval',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">New Registration Pending</h1>
        <p>A new user has registered and is awaiting approval:</p>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Role:</strong> ${userRole}</p>
        </div>
        <a href="${process.env.SERVERHOST_URL}/admin/users" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
          Review Registration
        </a>
      </div>
    `,
  }),

  gradePublished: (studentName: string, subject: string, score: string) => ({
    subject: `New Grade Posted for ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">New Grade Published</h1>
        <p>A new grade has been posted for ${studentName}:</p>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Score:</strong> ${score}</p>
        </div>
        <a href="${process.env.LOCALHOST_URL}/parent/grades" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
          View Grades
        </a>
      </div>
    `,
  }),

  attendanceAlert: (studentName: string, date: string, status: string) => ({
    subject: `Attendance Alert for ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #EF4444;">Attendance Alert</h1>
        <p>An attendance record has been marked for ${studentName}:</p>
        <div style="background: #FEE2E2; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Status:</strong> ${status}</p>
        </div>
        <a href="${process.env.LOCALHOST_URL}/parent/attendance" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
          View Attendance
        </a>
      </div>
    `,
  }),

  newAnnouncement: (title: string, preview: string) => ({
    subject: `New Announcement: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">${title}</h1>
        <p>${preview}</p>
        <a href="${process.env.LOCALHOST_URL}/announcements" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          View Full Announcement
        </a>
      </div>
    `,
  }),

  newEvent: (title: string, date: string, location: string) => ({
    subject: `New Event: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">New Event</h1>
        <h2>${title}</h2>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        <a href="${process.env.LOCALHOST_URL}/events" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
          View Event & RSVP
        </a>
      </div>
    `,
  }),
};

// Create transporter (configure based on your email provider)
const createTransporter = () => {
  // Using Gmail - for production, consider SendGrid or Resend
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
    },
  });
};

export interface EmailOptions {
  to: string | string[];
  template: keyof typeof templates;
  templateData: any[];
}

/**
 * Send an email using a template
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const templateFn = templates[options.template];
    
    if (!templateFn) {
      console.error(`Email template not found: ${options.template}`);
      return false;
    }

    const { subject, html } = (templateFn as any)(...options.templateData);

    await transporter.sendMail({
      from: `"Connected" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject,
      html,
    });

    console.log(`Email sent: ${subject} to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

/**
 * Send account approval email
 */
export const sendApprovalEmail = async (email: string, name: string): Promise<boolean> => {
  return sendEmail({
    to: email,
    template: 'accountApproved',
    templateData: [name],
  });
};

/**
 * Send new registration notification to admins
 */
export const sendNewRegistrationEmail = async (
  adminEmails: string[],
  userName: string,
  userRole: string
): Promise<boolean> => {
  return sendEmail({
    to: adminEmails,
    template: 'newRegistration',
    templateData: [userName, userRole],
  });
};

/**
 * Send grade notification to parent
 */
export const sendGradeEmail = async (
  email: string,
  studentName: string,
  subject: string,
  score: string
): Promise<boolean> => {
  return sendEmail({
    to: email,
    template: 'gradePublished',
    templateData: [studentName, subject, score],
  });
};

/**
 * Send attendance alert to parent
 */
export const sendAttendanceEmail = async (
  email: string,
  studentName: string,
  date: string,
  status: string
): Promise<boolean> => {
  return sendEmail({
    to: email,
    template: 'attendanceAlert',
    templateData: [studentName, date, status],
  });
};

export { templates };
