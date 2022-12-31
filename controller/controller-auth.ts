import http from "http";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

import SQLConnection from "../config/sql-connection";
import ParseJSON from "../utils/json-parse";
import RestAPIFormat from "../utils/rest-api-format";
import AuthAccessToken from "../utils/auth-access-token";
import EmailServices from "../utils/controller-email";

const saltRounds = 10;

const connection = SQLConnection.getInstance();
connection.getConnection();

let OTP = "";

class AuthRoute {
  constructor() {}

  public static async signInResponse(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    let requestBody: string;

    req.on("data", async (chunk) => {
      requestBody = ParseJSON.JSONtoObject(chunk);
    });

    req.on("end", () => {
      const { email, password } = JSON.parse(requestBody);
      connection
        .select(`SELECT * FROM user WHERE email=? `, [email])
        .then(async (chunk) => {
          if (chunk) {
            let verifyPassword = bcrypt.compareSync(password, chunk.password);

            if (verifyPassword) {
              const token = AuthAccessToken.createAccessToken({
                userId: chunk.user_id,
                email: chunk.email,
              });

              connection.update(`UPDATE user SET cookies=? WHERE user_id=?`, [
                token,
                chunk.user_id,
              ]);

              const result = JSON.stringify(
                RestAPIFormat.status200(
                  {
                    userId: chunk.user_id,
                    email: chunk.email,
                    username: chunk.username,
                    phone: chunk.hp,
                    image: chunk.img,
                    token: token,
                    ballance: chunk.saldo,
                    playtime: chunk.playtime,
                    create_at: chunk.create_at,
                    update_at: chunk.update_at,
                  },
                  "Sign in success"
                )
              );

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(result);
            } else {
              res.writeHead(401, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify(RestAPIFormat.status401({}, "Wrong password"))
              );
            }
          } else {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify(
                RestAPIFormat.status401({}, "Email not registered")
              )
            );
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  public static async signUpEmailResponse(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    req.on("data", async (chunk) => {
      const requestBody = ParseJSON.JSONtoObject(chunk);
      const { email, password, username, phone } = JSON.parse(requestBody);

      OTP = Math.floor(100000 + Math.random() * 900000).toString();

      connection
        .select(`SELECT * FROM user WHERE email=?`, [email])
        .then((chunk) => {
          if (!chunk) {
            EmailServices.sendEmailVerification(email, OTP);

            const result = JSON.stringify(
              RestAPIFormat.status200(
                {
                  OTP,
                },
                "Sign up in progress"
              )
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(result);
          } else {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify(RestAPIFormat.status401({}, "Email already used"))
            );
          }
        });
    });
  }

  public static async signUpResponse(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    req.on("data", async (chunk) => {
      const requestBody = ParseJSON.JSONtoObject(chunk);
      const { email, password, username, phone } = JSON.parse(requestBody);
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const userId = uuidv4();
      const userBalance = 0;
      const create_at = new Date();
      const update_at = new Date();
      const token = AuthAccessToken.createAccessToken({
        userId,
        email,
      });

      connection
        .insert(
          `INSERT INTO user (user_id, email, username, hp, password, cookies, create_at, update_at, saldo, playtime, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            email,
            username,
            phone,
            hashedPassword,
            token,
            create_at,
            update_at,
            userBalance,
            0,
            "/",
          ]
        )

        .then((_) => {
          const fileName = `${userId.replace(/-/gi, "")}`;

          try {
            fs.mkdir(
              path.join(
                __dirname,
                `../assets/images/${userId.replace(/-/gi, "")}`
              ),
              (err) => {
                if (err) {
                  console.log(err);
                }
              }
            );

            fs.copyFile(
              path.join(__dirname, `../assets/images/avatar-profile-100.jpg`),
              path.join(
                __dirname,
                `../assets/images/${fileName}/${fileName}-profile.jpg`
              ),
              (err) => {
                if (err) throw err;
              }
            );

            connection.update(`UPDATE user SET img=? WHERE user_id=?`, [
              `${fileName}-profile.jpg`,
              userId,
            ]);
          } catch (error) {
            if (error) throw error;
          }

          const result = JSON.stringify(
            RestAPIFormat.status201(
              {
                userId,
                email,
                username,
                phone,
                images: `${fileName}-profile.jpg`,
                token,
                create_at,
                update_at,
              },
              "Sign up success"
            )
          );

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(result);
        })
        .catch((err) => {
          res.writeHead(500, { "Content-Type": "application/json" });
          if (err.errno == 1062) {
            res.end(
              JSON.stringify(
                RestAPIFormat.status400(err, "Email already exist")
              )
            );
          } else {
            res.end(JSON.stringify({ error: err }));
          }
        });
    });
  }

  public static async signOutResponse(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = JSON.parse(
      AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
    );

    let userData: any;

    await connection
      .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
      .then((chunk) => {
        userData = chunk;
      });

    if (req.headers.authorization == userData.cookies) {
      connection.update(`UPDATE user SET cookies=?, fcm = ? WHERE user_id=?`, [
        "",
        "",
        token.userId,
      ]);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status200({}, "Sign out success")));
    } else {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status401({}, "Unauthorized")));
    }
  }

  public static async forgotPasswordOtpResponse(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    req.on("data", async (chunk) => {
      const requestBody = ParseJSON.JSONtoObject(chunk);
      const { email } = JSON.parse(requestBody);

      connection
        .select(`SELECT * FROM user WHERE email=?`, [email])
        .then((data) => {
          if (data) {
            OTP = Math.floor(100000 + Math.random() * 900000).toString();
            EmailServices.sendEmailResetPassword(email, OTP);

            const result = JSON.stringify(
              RestAPIFormat.status200(
                {
                  OTP,
                },
                "Forgot password in progress"
              )
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(result);
          } else {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify(
                RestAPIFormat.status401({}, "Email not registered")
              )
            );
          }
        });
    });
  }

  public static async forgotPasswordResponse(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    req.on("data", async (chunk) => {
      const requestBody = ParseJSON.JSONtoObject(chunk);
      const { email, password } = JSON.parse(requestBody);
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      console.log(email + ", " + password + ", " + hashedPassword);

      connection
        .update(`UPDATE user SET password=? WHERE email=?`, [
          hashedPassword,
          email,
        ])
        .then((_) => {
          const result = JSON.stringify(
            RestAPIFormat.status200({}, "Password reset success")
          );

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(result);
        });
    });
  }
}

export default AuthRoute;
