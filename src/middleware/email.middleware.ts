//mailJet
// function email_sender(subject: any, to: any, content: any, textpart: any, name: any) {
//   const mailjet = require("node-mailjet").connect(
//     process.env.MJ_APIKEY_PUBLIC,
//     process.env.MJ_APIKEY_PRIVATE
//   );
//   const sendemail = mailjet.post("send", { version: "v3.1" }).request({
//     Messages: [
//       {
//         From: {
//           Email: process.env.EMAIL_FROM,
//           Name: "Finsweet",
//         },
//         To: [
//           {
//             Email: to,
//             Name: name,
//           },
//         ],
//         Subject: subject,
//         TextPart: textpart,
//         HTMLPart: content,
//       },
//     ],
//   });
//   sendemail
//     .then((result: any) => {
//       console.log(result.body);
//       return result.body;
//     })
//     .catch((err: any) => {
//       console.log(err.statusCode);
//       return err.statusCode;
//     });
// }

import sgMail from "@sendgrid/mail"; // SENDGRID_API_KEY

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function email_sender(subject: any, to: any, content: any) {
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
