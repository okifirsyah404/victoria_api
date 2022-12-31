import http from "http";
import fs from "fs";
import path from "path";

import SQLConnection from "../config/sql-connection";
import RestAPIFormat from "../utils/rest-api-format";
import AuthAccessToken from "../utils/auth-access-token";
import ParseJSON from "../utils/json-parse";
import admin from "firebase-admin";
import bcrypt from "bcrypt";

const connection = SQLConnection.getInstance();
connection.getConnection();

class ServicesRoute {
  public static async postServiceData(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    try {
      const token = req.headers.authorization;

      if (token) {
        const authToken = JSON.parse(
          AuthAccessToken.checkAccessToken(token) ?? ""
        );

        let requestBody: string;

        req.on("data", async (chunk) => {
          requestBody = ParseJSON.JSONtoObject(chunk);
        });

        req.on("end", async () => {
          const { productName, problem, detailProblem } =
            JSON.parse(requestBody);

          const today = new Date();
          let servisData: any;
          let newServisId: string;

          let formattedDate = today.toLocaleString("id-ID", {
            day: "numeric",
            month: "numeric",
            year: "2-digit",
          });

          const newFormattedDate: String = formattedDate.replace(/\//g, "");

          await connection
            .select(
              `SELECT MAX(id_servis) AS id FROM servis where id_servis LIKE '%${newFormattedDate}%' ORDER BY id_servis DESC`
            )
            .then((chunk) => {
              servisData = chunk;
            })
            .catch((err) => {
              throw err;
            });

          if (servisData.id) {
            const oldRentalId = servisData.id;
            const regexp = /SR(\d{3})/;

            const matches = oldRentalId.match(regexp) ?? [];
            const number = matches[1];
            let getIntId = parseInt(number);

            newServisId = `SR${("00" + (getIntId + 1)).slice(
              -3
            )}-${newFormattedDate}`;
          } else {
            newServisId = `SR001-${newFormattedDate}`;
          }

          await connection
            .insert(
              `INSERT INTO servis(id_servis, nama_barang, kerusakan, detail, waktu_submit, status, est_selesai, lok, id_user) VALUES (?,?,?,?,?,?,?,?,?)`,
              [
                newServisId,
                productName,
                problem,
                detailProblem,
                today,
                "pending",
                null,
                "Bojonegoro",
                authToken.userId,
              ]
            )
            .catch((err) => {
              throw err;
            });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify(
              RestAPIFormat.status200(
                {
                  servisId: newServisId,
                },
                "Order success"
              )
            )
          );
        });
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify(RestAPIFormat.status401("Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }

  public static async verifyServiceData(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = req.headers.authorization;

    try {
      if (token) {
        const authToken = JSON.parse(
          AuthAccessToken.checkAccessToken(token) ?? ""
        );

        let requestBody: string;

        req.on("data", async (chunk) => {
          requestBody = ParseJSON.JSONtoObject(chunk);
        });

        req.on("end", async () => {
          const { password } = JSON.parse(requestBody);

          await connection
            .select("SELECT * FROM user WHERE user_id = ? ", [authToken.userId])
            .then((chunk) => {
              let verifyPassword = bcrypt.compareSync(password, chunk.password);

              if (verifyPassword) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(
                    RestAPIFormat.status200(
                      {
                        verified: true,
                      },
                      "Verified"
                    )
                  )
                );
              } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(
                    RestAPIFormat.status401(
                      {
                        verified: false,
                      },
                      "Wrong password"
                    )
                  )
                );
              }
            });
        });
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify(RestAPIFormat.status401("Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }

  public static async getServiceDataById(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    try {
      const token = req.headers.authorization;

      if (token) {
        let requestBody: string;

        req.on("data", async (chunk) => {
          requestBody = ParseJSON.JSONtoObject(chunk);
        });

        req.on("end", async () => {
          const { serviceId, fcmToken } = JSON.parse(requestBody);

          const authToken = JSON.parse(
            AuthAccessToken.checkAccessToken(token) ?? ""
          );

          await connection
            .select(
              `SELECT servis.*, lokasi.nama_loc, user.user_id, user.email, user.username, user.hp FROM servis JOIN lokasi ON servis.lok = lokasi.id_loc JOIN user ON servis.id_user = user.user_id WHERE id_servis = '${serviceId}' AND id_user = '${authToken.userId}'`
            )
            .then(async (chunk) => {
              if (chunk) {
                await admin.messaging().send({
                  token: fcmToken,
                  notification: {
                    title: "Servis Kamu Sedang Diproses",
                    body: `Servis ${chunk.nama_barang} kamu sedang diproses oleh teknisi kami`,
                  },
                });

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(
                    RestAPIFormat.status200(
                      {
                        serviceId: chunk.id_servis,
                        productName: chunk.nama_barang,
                        problem: chunk.kerusakan,
                        detailProblem: chunk.detail,
                        submitTime: chunk.waktu_submit,
                        status: chunk.status,
                        finishTime: chunk.est_selesai,
                        gameCenter: chunk.nama_loc,
                        location: chunk.lok,
                        userId: chunk.user_id,
                        email: chunk.email,
                        username: chunk.username,
                        phoneNumber: chunk.hp,
                      },
                      "Success"
                    )
                  )
                );
              } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(RestAPIFormat.status404("Service not found"))
                );
              }
            })
            .catch((err) => {
              throw err;
            });
        });
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify(RestAPIFormat.status401("Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }
}

export default ServicesRoute;
