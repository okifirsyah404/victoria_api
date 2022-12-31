import http from "http";
import fs from "fs";
import path from "path";
import admin from "firebase-admin";

import SQLConnection from "../config/sql-connection";
import RestAPIFormat from "../utils/rest-api-format";
import AuthAccessToken from "../utils/auth-access-token";
import ParseJSON from "../utils/json-parse";
import bcrypt from "bcrypt";

const connection = SQLConnection.getInstance();
connection.getConnection();

class OrderAtHomeRoute {
  public static async getOrderAtHomePlaystationTypes(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    try {
      const token = req.headers.authorization;

      if (token) {
        const authToken = JSON.parse(
          AuthAccessToken.checkAccessToken(token) ?? ""
        );

        let result: any[] = [];

        await connection
          .select(
            `SELECT COUNT(ps_sewa.id_ps) as jumlah, ps_sewa.harga, jenis.nama_jenis, ps_sewa.jenis FROM ps_sewa JOIN jenis ON ps_sewa.jenis = jenis.id_jenis WHERE ps_sewa.jenis = 'PS3' AND ps_sewa.lok = 'Bojonegoro' AND NOT status = 'perbaikan';`
          )
          .then(async (chunk) => {
            if (chunk) {
              const price =
                (await connection
                  .select(
                    `SELECT MAX(harga) FROM ps_sewa WHERE ps_sewa.jenis = 'PS3' AND ps_sewa.lok = 'Bojonegoro';`
                  )
                  .then((data) => {
                    return data["MAX(harga)"];
                  })) ?? 0;

              result.push({
                playstationType: chunk.jenis ?? "PS3",
                playstationTypeName: chunk.nama_jenis,
                price,
                available: chunk.jumlah ?? 0,
              });
            }
          });

        await connection
          .select(
            `SELECT COUNT(ps_sewa.id_ps) as jumlah, ps_sewa.harga, jenis.nama_jenis, ps_sewa.jenis FROM ps_sewa JOIN jenis ON ps_sewa.jenis = jenis.id_jenis WHERE ps_sewa.jenis = 'PS4' AND ps_sewa.lok = 'Bojonegoro' AND NOT status = 'perbaikan';`
          )
          .then(async (chunk) => {
            if (chunk) {
              const price =
                (await connection
                  .select(
                    `SELECT MAX(harga) FROM ps_sewa WHERE ps_sewa.jenis = 'PS4' AND ps_sewa.lok = 'Bojonegoro';`
                  )
                  .then((data) => {
                    return data["MAX(harga)"];
                  })) ?? 0;

              result.push({
                playstationType: chunk.jenis ?? "PS4",
                playstationTypeName: chunk.nama_jenis,
                price,
                available: chunk.jumlah ?? 0,
              });
            }
          });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(RestAPIFormat.status200(result, "Success")));
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify(RestAPIFormat.status401("Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }

  public static async getOrderAtHomePlaystationType(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    try {
      const token = req.headers.authorization;

      if (token) {
        let requestBody: string;

        req.on("data", (chunk) => {
          requestBody = ParseJSON.JSONtoObject(chunk);
        });

        req.on("end", async () => {
          const { playstationType } = JSON.parse(requestBody);

          await connection
            .select(
              `SELECT COUNT(ps_sewa.id_ps) as jumlah, ps_sewa.harga, jenis.nama_jenis, ps_sewa.jenis FROM ps_sewa JOIN jenis ON ps_sewa.jenis = jenis.id_jenis WHERE ps_sewa.jenis = ? AND ps_sewa.lok = 'Bojonegoro' AND NOT status = 'perbaikan';`,
              [playstationType]
            )
            .then(async (chunk) => {
              if (chunk) {
                const price =
                  (await connection
                    .select(
                      `SELECT MAX(harga) FROM ps_sewa WHERE ps_sewa.jenis = ? AND ps_sewa.lok = 'Bojonegoro';`,
                      [playstationType]
                    )
                    .then((data) => {
                      return data["MAX(harga)"];
                    })) ?? 0;

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(
                    RestAPIFormat.status200(
                      {
                        playstationType: chunk.jenis,
                        playstationTypeName: chunk.nama_jenis,
                        price,
                        available: chunk.jumlah,
                      },
                      "Success"
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

  public static async getOrderAtHomePlaystationList(
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

        req.on("data", (chunk) => {
          requestBody = ParseJSON.JSONtoObject(chunk);
        });

        req.on("end", async () => {
          const { playstationType, startTime, finishTime } =
            JSON.parse(requestBody);

          let result: any[] = [];

          await connection
            .selectAll(
              `SELECT ps_sewa.id_ps, jenis.nama_jenis, ps_sewa.status, ps_sewa.harga FROM ps_sewa JOIN jenis ON ps_sewa.jenis = jenis.id_jenis WHERE ps_sewa.id_ps NOT IN (SELECT id_ps from sewa WHERE lok = 'Bojonegoro' AND ((mulai_sewa >= '${startTime}' AND akhir_sewa <= '${finishTime}') OR ('${startTime}' BETWEEN mulai_sewa AND akhir_sewa) OR ('${finishTime}' BETWEEN mulai_sewa AND akhir_sewa))) AND jenis = '${playstationType}' AND status = 'tidak aktif';`
            )
            .then(async (chunk) => {
              if (chunk) {
                chunk.forEach((data: any) => {
                  result.push({
                    playstationId: data.id_ps,
                    playstationType: data.nama_jenis,
                    price: data.harga,
                    status: data.status,
                  });
                });
              }
            });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(RestAPIFormat.status200(result, "Success")));
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

  public static async getOrderAtHomePlaystationDetail(
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

        req.on("data", (chunk) => {
          requestBody = ParseJSON.JSONtoObject(chunk);
        });

        req.on("end", async () => {
          const { playstationId } = JSON.parse(requestBody);

          await connection
            .select(
              `SELECT ps_sewa.id_ps, jenis.nama_jenis, ps_sewa.status, ps_sewa.harga FROM ps_sewa JOIN jenis ON ps_sewa.jenis = jenis.id_jenis WHERE ps_sewa.id_ps = '${playstationId}';`
            )
            .then(async (chunk) => {
              if (chunk) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(
                    RestAPIFormat.status200(
                      {
                        playstationId: chunk.id_ps,
                        playstationType: chunk.nama_jenis,
                        price: chunk.harga,
                        status: chunk.status,
                      },
                      "Success"
                    )
                  )
                );
              } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify(RestAPIFormat.status404("Not Found")));
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

  public static async verifyOrderAtHomeData(
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

  public static async postOrderAtHome(
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
          const {
            playstationId,
            totalAmount,
            playtime,
            startDate,
            endDate,
            shipmentMethod,
            latitude,
            longitude,
            description,
            paymentMethod,
            address,
          } = JSON.parse(requestBody);

          const today = new Date();
          let rentalData: any;
          let newRentalId: string;

          let formattedDate = today.toLocaleString("id-ID", {
            day: "numeric",
            month: "numeric",
            year: "2-digit",
          });

          const newFormattedDate: String = formattedDate.replace(/\//g, "");

          await connection
            .select(
              `SELECT MAX(id_sewa) AS id FROM sewa where id_sewa LIKE '%${newFormattedDate}%' ORDER BY id_sewa DESC`
            )
            .then((chunk) => {
              rentalData = chunk;
            })
            .catch((err) => {
              throw err;
            });

          if (rentalData.id) {
            const oldRentalId = rentalData.id;
            const regexp = /SW(\d{3})/;

            const matches = oldRentalId.match(regexp) ?? [];
            const number = matches[1];
            let getIntId = parseInt(number);

            newRentalId = `SW${("00" + (getIntId + 1)).slice(
              -3
            )}-${newFormattedDate}`;
          } else {
            newRentalId = `SW001-${newFormattedDate}`;
          }

          let newShipmentMethod: string;

          console.log(shipmentMethod);
          console.log(typeof shipmentMethod);

          if (shipmentMethod == "Shipment by Official") {
            newShipmentMethod = "delivery";
          } else {
            newShipmentMethod = "ambil";
          }

          await connection
            .insert(
              `INSERT INTO sewa(id_sewa, id_ps, status, pil_kirim, waktu_order, mulai_sewa, akhir_sewa, playtime, bayar, latitude, longitude, address, description, lok, id_user, payment_method) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                newRentalId,
                playstationId,
                "pending",
                newShipmentMethod,
                today,
                startDate,
                endDate,
                playtime,
                totalAmount,
                latitude,
                longitude,
                address,
                description,
                "Bojonegoro",
                authToken.userId,
                paymentMethod.toLowerCase(),
              ]
            )
            .catch((err) => {
              throw err;
            });

          if (paymentMethod == "Saldo") {
            await connection
              .update(`UPDATE user SET saldo = saldo - ? WHERE user_id = ?`, [
                totalAmount,
                authToken.userId,
              ])
              .catch((error) => {
                throw error;
              });
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify(
              RestAPIFormat.status200(
                {
                  rentalId: newRentalId,
                },
                "Order at home success"
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

  public static async getOrderAtHomeById(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = req.headers.authorization;

    try {
      if (token) {
        const authToken = JSON.parse(
          AuthAccessToken.checkAccessToken(token) ?? ""
        );

        req.on("data", async (chunk) => {
          requestBody = ParseJSON.JSONtoObject(chunk);
        });

        let requestBody: string;

        req.on("end", async () => {
          const { rentalId, fcmToken } = JSON.parse(requestBody);

          await connection
            .select(
              `SELECT sewa.id_sewa, sewa.status, sewa.waktu_order, sewa.mulai_sewa, sewa.akhir_sewa, sewa.playtime, sewa.bayar, sewa.payment_method, sewa.pil_kirim, sewa.address, sewa.description, lokasi.nama_loc, jenis.nama_jenis, user.user_id, user.username, user.email, user.hp FROM sewa JOIN lokasi ON sewa.lok = lokasi.id_loc JOIN ps_sewa ON sewa.id_ps = ps_sewa.id_ps JOIN jenis ON ps_sewa.jenis = jenis.id_jenis JOIN user ON sewa.id_user = user.user_id WHERE id_sewa = ? AND id_user = ?`,
              [rentalId, authToken.userId]
            )
            .then(async (chunk) => {
              if (chunk) {
                await admin
                  .messaging()
                  .send({
                    token: fcmToken,
                    notification: {
                      title: "Kamu berhasil melakukan pemesanan",
                      body: `Kamu berhasil melakukan pemesanan main di rumah kamu`,
                    },
                  })
                  .then((response) => {
                    console.log("Successfully sent message:", response);
                  });

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(
                    RestAPIFormat.status200(
                      {
                        rentalId: chunk.id_sewa,
                        status: chunk.status,
                        orderTime: chunk.waktu_order,
                        startTime: chunk.mulai_sewa,
                        endTime: chunk.akhir_sewa,
                        playtime: chunk.playtime,
                        totalAmount: chunk.bayar,
                        paymentMethod: chunk.payment_method,
                        shipmentMethod: chunk.pil_kirim,
                        address: chunk.address,
                        description: chunk.description,
                        location: chunk.nama_loc,
                        playstationType: chunk.nama_jenis,
                        userId: chunk.user_id,
                        username: chunk.username,
                        email: chunk.email,
                        phoneNumber: chunk.hp,
                      },
                      "Data found"
                    )
                  )
                );
              } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(RestAPIFormat.status404("Data not found"))
                );
              }
            })
            .catch((error) => {
              throw error;
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

export default OrderAtHomeRoute;
