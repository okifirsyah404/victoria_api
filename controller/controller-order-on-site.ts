import http from "http";
import fs from "fs";
import path from "path";

import SQLConnection from "../config/sql-connection";
import RestAPIFormat from "../utils/rest-api-format";
import AuthAccessToken from "../utils/auth-access-token";
import ParseJSON from "../utils/json-parse";
import bcrypt from "bcrypt";

const connection = SQLConnection.getInstance();
connection.getConnection();

class OrderOnSiteRoute {
  public static async getOrderOnSiteData(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = req.headers.authorization;

    try {
      if (token) {
        let requestBody: string;

        req.on("data", async (chunk) => {
          requestBody = ParseJSON.JSONtoObject(chunk);
        });

        req.on("end", async () => {
          const { gameCenterId, playstationId } = JSON.parse(requestBody);

          let gameCenterData: any;
          let playstationData: any;

          await connection
            .select("SELECT * FROM lokasi WHERE id_loc=? ", [gameCenterId])
            .then((chunk) => {
              gameCenterData = chunk;
            });

          await connection
            .select(
              "SELECT ps.id_ps, ps.nama_ps, ps.lok, ps.status, jenis.nama_jenis, ps.harga FROM ps JOIN jenis ON ps.jenis = jenis.id_jenis WHERE ps.id_ps = ?; ",
              [playstationId]
            )
            .then((chunk) => {
              playstationData = chunk;
            });

          const data = {
            locationId: gameCenterData.id_loc,
            locationName: gameCenterData.nama_loc,
            locationAddress: gameCenterData.address,
            playstationId: playstationData.id_ps,
            playstationName: playstationData.nama_ps,
            playstationType: playstationData.nama_jenis,
            playstaionPrice: playstationData.harga,
          };

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(RestAPIFormat.status200(data)));
        });
      } else {
        res.writeHead(401);
        res.end(JSON.stringify(RestAPIFormat.status401("Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }

  public static async getAllTimeOrderOnSiteData(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = req.headers.authorization;

    try {
      if (token) {
        let requestBody: string;

        req.on("data", async (chunk) => {
          requestBody = ParseJSON.JSONtoObject(chunk);
        });

        req.on("end", async () => {
          const { gameCenterId, playstationId } = JSON.parse(requestBody);

          let timeData: any;

          await connection
            .selectAll(
              `SELECT rental.id_rental, rental.id_ps, rental.mulai_rental, rental.selesai_rental, rental.lok, ps.jenis, ps.status FROM rental JOIN ps ON ps.id_ps = rental.id_ps WHERE rental.selesai_rental >= CURRENT_TIMESTAMP AND rental.lok = ? AND rental.id_ps = ?  ORDER BY rental.mulai_rental ASC`,
              [gameCenterId, playstationId]
            )
            .then((chunk) => {
              timeData = [
                ...chunk.map((item: any) => {
                  return {
                    rentalId: item.id_rental,
                    playstationId: item.id_ps,
                    startTime: item.mulai_rental,
                    endTime: item.selesai_rental,
                    locationId: item.lok,
                    playstationType: item.jenis,
                    playstationStatus: item.status,
                  };
                }),
              ];
            });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(RestAPIFormat.status200(timeData, "Success")));
        });
      } else {
        res.writeHead(401);
        res.end(JSON.stringify(RestAPIFormat.status401("Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }

  public static async verifyOrderOnSiteData(
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
        res.writeHead(401);
        res.end(JSON.stringify(RestAPIFormat.status401("Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }

  public static async postOrderOnSiteDataById(
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
          const {
            playtime,
            startPlay,
            endPlay,
            paymentMethod,
            playstationId,
            totalAmount,
            gameCenterId,
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
              `SELECT MAX(id_rental) AS id FROM rental where id_rental LIKE '%${newFormattedDate}%' ORDER BY id_rental DESC`
              // [newFormattedDate]
            )
            .then((chunk) => {
              rentalData = chunk;
            })
            .catch((err) => {
              throw err;
            });

          if (rentalData.id) {
            const oldRentalId = rentalData.id;
            const regexp = /RT(\d{3})/;

            const matches = oldRentalId.match(regexp) ?? [];
            const number = matches[1];
            let getIntId = parseInt(number);

            newRentalId = `RT${("00" + (getIntId + 1)).slice(
              -3
            )}-${newFormattedDate}`;
          } else {
            newRentalId = `RT001-${newFormattedDate}`;
          }

          await connection
            .insert(
              `INSERT INTO rental(id_rental, id_ps, waktu_order, playtime, mulai_rental, selesai_rental, bayar, lok, id_user) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                newRentalId,
                playstationId,
                today,
                playtime,
                startPlay,
                endPlay,
                totalAmount,
                gameCenterId,
                authToken.userId,
              ]
            )
            .catch((error) => {
              throw error;
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
                "Order success"
              )
            )
          );
        });
      } else {
        res.writeHead(401);
        res.end(JSON.stringify(RestAPIFormat.status401("Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }

  public static async getOrderOnSiteDataById(
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
          const { rentalId } = JSON.parse(requestBody);

          await connection
            .select(
              `SELECT rental.id_rental, rental.bayar, lokasi.nama_loc, lokasi.id_loc, jenis.nama_jenis, ps.id_ps, rental.playtime, rental.mulai_rental, user.user_id, user.email, user.username, user.hp FROM rental JOIN lokasi ON rental.lok = lokasi.id_loc JOIN ps ON rental.id_ps = ps.id_ps JOIN jenis ON ps.jenis = jenis.id_jenis JOIN user ON rental.id_user = user.user_id WHERE rental.id_rental = ?`,
              [rentalId]
            )
            .then((chunk) => {
              if (chunk) {
                var utcDateformat: Date = chunk.mulai_rental;
                console.log(utcDateformat);

                var wibDateformat = utcDateformat.toLocaleString("id-ID", {
                  timeZone: "Asia/Jakarta",
                });

                console.log();
                console.log(Date.parse(wibDateformat));

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(
                    RestAPIFormat.status200(
                      {
                        rentalId: chunk.id_rental,
                        totalAmount: chunk.bayar,
                        gameCenterId: chunk.id_loc,
                        gameCenterName: chunk.nama_loc,
                        playstationId: chunk.id_ps,
                        playstationType: chunk.nama_jenis,
                        playtime: chunk.playtime,
                        startPlay: chunk.mulai_rental,
                        userId: chunk.user_id,
                        userEmail: chunk.email,
                        userName: chunk.username,
                        userPhone: chunk.hp,
                      },
                      "Data found"
                    )
                  )
                );
              } else {
                res.writeHead(404);
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
        res.writeHead(401);
        res.end(JSON.stringify(RestAPIFormat.status401("Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }
}

export default OrderOnSiteRoute;
