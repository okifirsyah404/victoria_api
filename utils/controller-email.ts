import nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

class EmailServices {
  constructor() {}

  private transporter = nodemailer.createTransport({
    // host: process.env.MAIL_SERVER || "gollum.sg.rapidplex.com",
    // port: 465,
    // secure: true,
    // auth: {
    //   user: process.env.MAIL_USERNAME || "",
    //   pass: process.env.MAIL_PASSWORD || "",
    // },
    host: "gollum.sg.rapidplex.com",
    port: 465,
    secure: true,
    auth: {
      user: "tolonto@tolontoapi.okifirsyah.com",
      pass: "tolonto123456",
    },
  });

  public async sendEmail(email: string, subject: string, html: string) {
    const mailOptions = {
      from: "tolonto@tolontoapi.okifirsyah.com",
      to: email,
      subject: subject,
      html: html,
    };

    this.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }

  public async sendEmailVerification(email: string, token: string) {
    this.sendEmail(
      email,
      "Email verification",
      `<h2>Verifikasi Email</h2>

      <p>Harap inputkan kode berikut untuk pendaftaran Tolonto Game.</p>

      </br>
      </br>
       <h3><b>${token}</b></h3>
       </br>
       </br>
       <p>Jika ini bukan anda, harap abaikan email ini.</p>
       `
    );
  }
}

export default new EmailServices();
