

import sgMail from "@sendgrid/mail"; 
import { String } from "aws-sdk/clients/cloudtrail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function email_sender(subject: string, to: string, content: String) {
  const emailData = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: subject,
    html: content,
  };
  sgMail.send(emailData);

  return "email Sent";
}

export default email_sender;
