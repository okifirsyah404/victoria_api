import http from "http";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

import SQLConnection from "../config/sql-connection";
import RestAPIFormat from "../utils/rest-api-format";
import AuthAccessToken from "../utils/auth-access-token";

import formidable from "formidable";
import ParseJSON from "../utils/json-parse";
import EmailServices from "../utils/controller-email";

const connection = SQLConnection.getInstance();
connection.getConnection();

const saltRounds = 10;
class RouteUser {
  public static async getUser(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    try {
      let token: any;

      const verifyToken =
        AuthAccessToken.checkAccessToken(req.headers.authorization) ?? "";

      if (verifyToken) {
        token = JSON.parse(verifyToken);
        let requestBody: string;

        req.on("data", async (chunk) => {
          requestBody = ParseJSON.JSONtoObject(chunk);
        });

        req.on("end", async () => {
          const { fcmToken } = JSON.parse(requestBody);

          await connection
            .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
            .then(async (chunk) => {
              let newPlaytime: string;

              await connection.update(
                `UPDATE user SET fcm = ? WHERE user_id = ?`,
                [fcmToken, token.userId]
              );

              await connection
                .select(
                  `SELECT SUM(rental.playtime) FROM rental JOIN user ON rental.id_user = user.user_id WHERE user.user_id = ? and rental.selesai_rental < CURRENT_TIMESTAMP;`,
                  [token.userId]
                )
                .then((data) => {
                  if (data["SUM(rental.playtime)"]) {
                    newPlaytime = data["SUM(rental.playtime)"].toString();

                    connection.update(
                      `UPDATE user SET playtime = ? WHERE user_id = ?`,
                      [newPlaytime, token.userId]
                    );
                  } else {
                    newPlaytime = "0";
                  }
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify(
                      RestAPIFormat.status200(
                        {
                          userId: chunk.user_id,
                          email: chunk.email,
                          username: chunk.username,
                          phone: chunk.hp,
                          address: chunk.id_address,
                          image: chunk.img,
                          ballance: chunk.saldo,
                          playTime: parseInt(newPlaytime),
                          token: req.headers.authorization,
                          create_at: chunk.create_at,
                          update_at: chunk.update_at,
                        },
                        "Success get user data"
                      )
                    )
                  );
                });
            })
            .catch((err) => {
              throw err;
            });
        });
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify(RestAPIFormat.status401({}, "Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }

  public static async getUserImage(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = JSON.parse(
        AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
      );

      let userData: any;

      await connection
        .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
        .then((chunk) => {
          userData = chunk;
        });

      const filePath = path.join(
        __dirname,
        `../assets/images/${userData.user_id.replace(/-/gi, "")}/${
          userData.img
        }`
      );

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end(JSON.stringify(RestAPIFormat.status404(err)));
          return;
        }

        res.writeHead(200, {
          "Content-Type": "image/jpeg",
          "Content-Length": data.length,
        });
        res.end(data);
      });
    } else {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status401({}, "Unauthorized")));
    }
  }

  public static async getUserImageById(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    try {
      let requestBody: any;

      req.on("data", async (chunk) => {
        requestBody = ParseJSON.JSONtoObject(chunk);
      });

      req.on("end", async () => {
        const { userId } = JSON.parse(requestBody);
        let userData: any;

        await connection
          .select(`SELECT * FROM user WHERE user_id=?`, [userId])
          .then((chunk) => {
            userData = chunk;
          });

        const filePath = path.join(
          __dirname,
          `../assets/images/${userData.user_id.replace(/-/gi, "")}/${
            userData.img
          }`
        );

        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(RestAPIFormat.status404(err)));
            return;
          }

          res.writeHead(200, {
            "Content-Type": "image/jpeg",
            "Content-Length": data.length,
          });
          res.end(data);
        });
      });
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }

  public static async updateUsername(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = JSON.parse(
        AuthAccessToken.checkAccessToken(authHeader) ?? ""
      );

      req.on("data", async (chunk) => {
        const requestBody = ParseJSON.JSONtoObject(chunk);
        const { username } = JSON.parse(requestBody);

        await connection
          .update(`UPDATE user SET username=?, update_at=? WHERE user_id=?`, [
            username,
            new Date(),
            token.userId,
          ])
          .then(() => {
            connection
              .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
              .then((data) => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(
                    RestAPIFormat.status200(
                      {
                        userId: data.user_id,
                        email: data.email,
                        username: data.username,
                        phone: data.hp,
                        address: data.id_address,
                        image: data.img,
                        ballance: data.saldo,
                        playTime: data.playtime,
                        token: req.headers.authorization,
                        create_at: data.create_at,
                        update_at: data.update_at,
                      },
                      "Success update username"
                    )
                  )
                );
              })
              .catch((err) => {
                throw err;
              });
          })
          .catch((err) => {
            res.writeHead(404);
            res.end(JSON.stringify(RestAPIFormat.status404(err)));
          });
      });
    } else {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status401({}, "Unauthorized")));
    }
  }

  public static async sendOtpUpdatePassword(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = JSON.parse(
        AuthAccessToken.checkAccessToken(authHeader) ?? ""
      );

      connection
        .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
        .then((data) => {
          if (data) {
            var OTP = Math.floor(100000 + Math.random() * 900000).toString();
            EmailServices.sendEmailChangePassword(data.email, OTP);

            const result = JSON.stringify(
              RestAPIFormat.status200(
                {
                  OTP,
                },
                "Reset password in progress"
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
    } else {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status401({}, "Unauthorized")));
    }
  }

  public static async updatePassword(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = JSON.parse(
        AuthAccessToken.checkAccessToken(authHeader) ?? ""
      );

      req.on("data", async (chunk) => {
        const requestBody = ParseJSON.JSONtoObject(chunk);

        const { password } = JSON.parse(requestBody);
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await connection
          .update(`UPDATE user SET password=?, update_at=? WHERE user_id=?`, [
            hashedPassword,
            new Date(),
            token.userId,
          ])
          .then(() => {
            connection
              .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
              .then((data) => {
                connection.update(
                  `UPDATE user SET update_at=? WHERE user_id=?`,
                  [new Date(), token.userId]
                );

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(
                    RestAPIFormat.status200(
                      {
                        userId: data.user_id,
                        email: data.email,
                        username: data.username,
                        phone: data.hp,
                        address: data.id_address,
                        image: data.img,
                        ballance: data.saldo,
                        playTime: data.playtime,
                        token: req.headers.authorization,
                        create_at: data.create_at,
                        update_at: data.update_at,
                      },
                      "Success update password"
                    )
                  )
                );
              })
              .catch((err) => {
                throw err;
              });
          })
          .catch((err) => {
            res.writeHead(404);
            res.end(JSON.stringify(RestAPIFormat.status404(err)));
          });
      });
    } else {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status401({}, "Unauthorized")));
    }
  }

  public static async updatePhone(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = JSON.parse(
        AuthAccessToken.checkAccessToken(authHeader) ?? ""
      );

      req.on("data", async (chunk) => {
        const requestBody = ParseJSON.JSONtoObject(chunk);
        const { phone } = JSON.parse(requestBody);

        await connection
          .update(`UPDATE user SET hp=?, update_at=? WHERE user_id=?`, [
            phone,
            new Date(),
            token.userId,
          ])
          .then(() => {
            connection
              .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
              .then((data) => {
                connection.update(
                  `UPDATE user SET update_at=? WHERE user_id=?`,
                  [new Date(), token.userId]
                );

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(
                    RestAPIFormat.status200(
                      {
                        userId: data.user_id,
                        email: data.email,
                        username: data.username,
                        phone: data.hp,
                        address: data.id_address,
                        image: data.img,
                        ballance: data.saldo,
                        playTime: data.playtime,
                        token: req.headers.authorization,
                        create_at: data.create_at,
                        update_at: data.update_at,
                      },
                      "Success update phone"
                    )
                  )
                );
              })
              .catch((err) => {
                throw err;
              });
          })
          .catch((err) => {
            res.writeHead(404);
            res.end(JSON.stringify(RestAPIFormat.status404(err)));
          });
      });
    } else {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status401({}, "Unauthorized")));
    }
  }

  public static async uploadUserImage(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const authHeader = req.headers.authorization;

    try {
      if (authHeader) {
        const form = new formidable.IncomingForm({});

        form.parse(req, async (err, fields, files: any) => {
          const token = JSON.parse(
            AuthAccessToken.checkAccessToken(authHeader) ?? ""
          );

          let userData: any;

          await connection
            .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
            .then((chunk) => {
              userData = chunk;
            });

          const oldPath = files.file.filepath;
          const newPath = path.join(
            __dirname,
            `../assets/images/${token.userId.replace(/-/gi, "")}/${
              userData.img
            }`
          );

          fs.copyFile(oldPath, newPath, (err) => {
            if (err) throw err;
          });

          const result = JSON.stringify(
            RestAPIFormat.status201(
              {
                userId: userData.userId,
                email: userData.email,
                username: userData.username,
                phone: userData.phone,
                images: userData.img,
                ballance: userData.saldo,
                playTime: userData.playtime,
                token: userData.cookies,
                create_at: userData.create_at,
                update_at: userData.update_at,
              },
              "Upload image success"
            )
          );

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(result);
        });
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify(RestAPIFormat.status401({}, "Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }
}

export default RouteUser;
