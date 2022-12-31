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

class HistoryRoute {
  public static async getCurrentOrderOnSite(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    try {
      const token = req.headers.authorization;

      if (token) {
        const authToken = JSON.parse(
          AuthAccessToken.checkAccessToken(token) ?? ""
        );

        let result = {};

        await connection
          .select(
            `SELECT rental.id_rental, rental.waktu_order, rental.mulai_rental, rental.selesai_rental, rental.playtime, ps.id_ps, jenis.nama_jenis FROM rental JOIN ps ON ps.id_ps = rental.id_ps JOIN jenis ON jenis.id_jenis = ps.jenis WHERE rental.mulai_rental <= CURRENT_TIMESTAMP AND rental.selesai_rental >= CURRENT_TIMESTAMP AND rental.id_user = ?`,
            [authToken.userId]
          )
          .then((chunk) => {
            if (chunk) {
              result = {
                rentalId: chunk.id_rental,
                orderTime: chunk.waktu_order,
                startTime: chunk.mulai_rental,
                endTime: chunk.selesai_rental,
                playtime: chunk.playtime,
                playstationId: chunk.id_ps,
                playstationType: chunk.nama_jenis,
              };
            }
          })
          .catch((error) => {
            throw error;
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

  public static async getPreviousOrderOnSite(
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
          .selectAll(
            `SELECT rental.*, lokasi.nama_loc, jenis.nama_jenis FROM rental JOIN ps ON ps.id_ps = rental.id_ps JOIN lokasi ON rental.lok = lokasi.id_loc JOIN jenis ON jenis.id_jenis = ps.jenis WHERE rental.selesai_rental < CURRENT_TIMESTAMP AND rental.id_user = ? ORDER BY rental.waktu_order DESC`,
            [authToken.userId]
          )
          .then((chunk) => {
            chunk.forEach((element: any) => {
              result.push({
                rentalId: element.id_rental,
                orderTime: element.waktu_order,
                gameCenter: element.nama_loc,
                startTime: element.mulai_rental,
                endTime: element.selesai_rental,
                totalAmount: element.bayar,
                playtime: element.playtime,
                playstationId: element.id_ps,
                playstationType: element.nama_jenis,
              });
            });
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

  public static async getFutureOrderOnSite(
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
          .selectAll(
            `SELECT rental.*, lokasi.nama_loc, jenis.nama_jenis FROM rental JOIN ps ON ps.id_ps = rental.id_ps JOIN lokasi ON rental.lok = lokasi.id_loc JOIN jenis ON jenis.id_jenis = ps.jenis WHERE rental.mulai_rental > CURRENT_TIMESTAMP AND rental.id_user = ? ORDER BY rental.waktu_order DESC`,
            [authToken.userId]
          )
          .then((chunk) => {
            chunk.forEach((element: any) => {
              result.push({
                rentalId: element.id_rental,
                orderTime: element.waktu_order,
                gameCenter: element.nama_loc,
                startTime: element.mulai_rental,
                endTime: element.selesai_rental,
                totalAmount: element.bayar,
                playtime: element.playtime,
                playstationId: element.id_ps,
                playstationType: element.nama_jenis,
              });
            });
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

  public static async getOrderOnSiteDetails(
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
          const { rentalId } = JSON.parse(requestBody);

          await connection
            .select(
              `SELECT rental.id_rental, rental.id_ps, rental.waktu_order, rental.playtime, rental.mulai_rental, rental.selesai_rental, rental.bayar, rental.payment_method, rental.lok, lokasi.nama_loc, jenis.nama_jenis, user.user_id, user.email, user.username, user.hp FROM rental JOIN lokasi ON rental.lok = lokasi.id_loc JOIN ps ON rental.id_ps = ps.id_ps JOIN jenis ON jenis.id_jenis = ps.jenis JOIN user ON rental.id_user = user.user_id WHERE rental.id_rental = ? AND rental.id_user = ?`,
              [rentalId, authToken.userId]
            )
            .then((chunk) => {
              if (chunk) {
                const result = {
                  rentalId: chunk.id_rental,
                  orderTime: chunk.waktu_order,
                  gameCenter: chunk.nama_loc,
                  gameCenterLocation: chunk.lok,
                  startTime: chunk.mulai_rental,
                  endTime: chunk.selesai_rental,
                  totalAmount: chunk.bayar,
                  paymentMethod: chunk.payment_method,
                  playtime: chunk.playtime,
                  playstationId: chunk.id_ps,
                  playstationType: chunk.nama_jenis,
                  userId: chunk.user_id,
                  email: chunk.email,
                  username: chunk.username,
                  phoneNumber: chunk.hp,
                };

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(RestAPIFormat.status200(result, "Success"))
                );
              } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify(RestAPIFormat.status404({}, "Not Found"))
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

  public static async getPendingPlaystationService(
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
          .selectAll(
            `SELECT ALL servis.*, lokasi.nama_loc, user.user_id, user.email, user.username, user.hp FROM servis JOIN lokasi ON servis.lok = lokasi.id_loc JOIN user ON servis.id_user = user.user_id WHERE servis.status = 'pending' AND id_user = '${authToken.userId}' ORDER BY servis.waktu_submit DESC`,
            [authToken.userId]
          )
          .then((chunk) => {
            chunk.forEach((element: any) => {
              result.push({
                serviceId: element.id_servis,
                productName: element.nama_barang,
                problem: element.kerusakan,
                detailProblem: element.detail,
                submitTime: element.waktu_submit,
                status: element.status,
                finishTime: element.est_selesai,
                gameCenter: element.nama_loc,
                location: element.lok,
              });
            });
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

  public static async getProgressPlaystationService(
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
          .selectAll(
            `SELECT ALL servis.*, lokasi.nama_loc, user.user_id, user.email, user.username, user.hp FROM servis JOIN lokasi ON servis.lok = lokasi.id_loc JOIN user ON servis.id_user = user.user_id WHERE servis.status = 'progress' AND id_user = '${authToken.userId}' ORDER BY servis.waktu_submit DESC`,
            [authToken.userId]
          )
          .then((chunk) => {
            chunk.forEach((element: any) => {
              result.push({
                serviceId: element.id_servis,
                productName: element.nama_barang,
                problem: element.kerusakan,
                detailProblem: element.detail,
                submitTime: element.waktu_submit,
                status: element.status,
                finishTime: element.est_selesai,
                gameCenter: element.nama_loc,
                location: element.lok,
              });
            });
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

  public static async getFinishedPlaystationService(
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
          .selectAll(
            `SELECT ALL servis.*, lokasi.nama_loc, user.user_id, user.email, user.username, user.hp FROM servis JOIN lokasi ON servis.lok = lokasi.id_loc JOIN user ON servis.id_user = user.user_id WHERE servis.status = 'selesai' AND id_user = '${authToken.userId}' ORDER BY servis.waktu_submit DESC`,
            [authToken.userId]
          )
          .then((chunk) => {
            chunk.forEach((element: any) => {
              result.push({
                serviceId: element.id_servis,
                productName: element.nama_barang,
                problem: element.kerusakan,
                detailProblem: element.detail,
                submitTime: element.waktu_submit,
                status: element.status,
                finishTime: element.est_selesai,
                gameCenter: element.nama_loc,
                location: element.lok,
              });
            });
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

  public static async getCanceledPlaystationService(
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
          .selectAll(
            `SELECT ALL servis.*, lokasi.nama_loc, user.user_id, user.email, user.username, user.hp FROM servis JOIN lokasi ON servis.lok = lokasi.id_loc JOIN user ON servis.id_user = user.user_id WHERE servis.status = 'batal' AND id_user = '${authToken.userId}' ORDER BY servis.waktu_submit DESC`,
            [authToken.userId]
          )
          .then((chunk) => {
            chunk.forEach((element: any) => {
              result.push({
                serviceId: element.id_servis,
                productName: element.nama_barang,
                problem: element.kerusakan,
                detailProblem: element.detail,
                submitTime: element.waktu_submit,
                status: element.status,
                finishTime: element.est_selesai,
                gameCenter: element.nama_loc,
                location: element.lok,
              });
            });
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

  public static async getPlaystationServiceDetailById(
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
          const { serviceId } = JSON.parse(requestBody);

          const authToken = JSON.parse(
            AuthAccessToken.checkAccessToken(token) ?? ""
          );

          await connection
            .select(
              `SELECT servis.*, lokasi.nama_loc, user.user_id, user.email, user.username, user.hp FROM servis JOIN lokasi ON servis.lok = lokasi.id_loc JOIN user ON servis.id_user = user.user_id WHERE id_servis = '${serviceId}' AND id_user = '${authToken.userId}'`
            )
            .then(async (chunk) => {
              if (chunk) {
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

  public static async getPendingOrderAtHome(
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
          .selectAll(
            `SELECT ALL sewa.*, lokasi.nama_loc, user.user_id, user.email, user.username, user.hp, jenis.nama_jenis FROM sewa JOIN lokasi ON sewa.lok = lokasi.id_loc JOIN user ON sewa.id_user = user.user_id JOIN ps_sewa ON sewa.id_ps = ps_sewa.id_ps JOIN jenis ON ps_sewa.jenis = jenis.id_jenis WHERE sewa.status = 'pending' AND sewa.id_user = ? ORDER BY sewa.waktu_order DESC`,
            [authToken.userId]
          )
          .then((chunk) => {
            chunk.forEach((element: any) => {
              result.push({
                orderId: element.id_sewa,
                playstationId: element.id_ps,
                playstationType: element.nama_jenis,
                status: element.status,
                shipmentMethod: element.pil_kirim,
                orderTime: element.waktu_order,
                startTime: element.waktu_mulai,
                finishTime: element.waktu_selesai,
                playtime: element.playtime,
                totalAmount: element.bayar,
                paymentMethod: element.payment_method,
                address: element.address,
                gameCenter: element.nama_loc,
                location: element.lok,
                userId: element.user_id,
                email: element.email,
                username: element.username,
                phoneNumber: element.hp,
                description: element.description,
              });
            });
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

  public static async getActiveOrderAtHome(
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
          .selectAll(
            `SELECT ALL sewa.*, lokasi.nama_loc, user.user_id, user.email, user.username, user.hp, jenis.nama_jenis FROM sewa JOIN lokasi ON sewa.lok = lokasi.id_loc JOIN user ON sewa.id_user = user.user_id JOIN ps_sewa ON sewa.id_ps = ps_sewa.id_ps JOIN jenis ON ps_sewa.jenis = jenis.id_jenis WHERE sewa.status = 'aktif' AND sewa.id_user = ? ORDER BY sewa.waktu_order DESC`,
            [authToken.userId]
          )
          .then((chunk) => {
            chunk.forEach((element: any) => {
              result.push({
                orderId: element.id_sewa,
                playstationId: element.id_ps,
                playstationType: element.nama_jenis,
                status: element.status,
                shipmentMethod: element.pil_kirim,
                orderTime: element.waktu_order,
                startTime: element.waktu_mulai,
                finishTime: element.waktu_selesai,
                playtime: element.playtime,
                totalAmount: element.bayar,
                paymentMethod: element.payment_method,
                address: element.address,
                gameCenter: element.nama_loc,
                location: element.lok,
                userId: element.user_id,
                email: element.email,
                username: element.username,
                phoneNumber: element.hp,
                description: element.description,
              });
            });
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

  public static async getFinishedOrderAtHome(
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
          .selectAll(
            `SELECT ALL sewa.*, lokasi.nama_loc, user.user_id, user.email, user.username, user.hp, jenis.nama_jenis FROM sewa JOIN lokasi ON sewa.lok = lokasi.id_loc JOIN user ON sewa.id_user = user.user_id JOIN ps_sewa ON sewa.id_ps = ps_sewa.id_ps JOIN jenis ON ps_sewa.jenis = jenis.id_jenis WHERE sewa.status = 'selesai' AND sewa.id_user = ? ORDER BY sewa.waktu_order DESC`,
            [authToken.userId]
          )
          .then((chunk) => {
            chunk.forEach((element: any) => {
              result.push({
                orderId: element.id_sewa,
                playstationId: element.id_ps,
                playstationType: element.nama_jenis,
                status: element.status,
                shipmentMethod: element.pil_kirim,
                orderTime: element.waktu_order,
                startTime: element.waktu_mulai,
                finishTime: element.waktu_selesai,
                playtime: element.playtime,
                totalAmount: element.bayar,
                paymentMethod: element.payment_method,
                address: element.address,
                gameCenter: element.nama_loc,
                location: element.lok,
                userId: element.user_id,
                email: element.email,
                username: element.username,
                phoneNumber: element.hp,
                description: element.description,
              });
            });
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

  public static async getCanceledOrderAtHome(
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
          .selectAll(
            `SELECT ALL sewa.*, lokasi.nama_loc, user.user_id, user.email, user.username, user.hp, jenis.nama_jenis FROM sewa JOIN lokasi ON sewa.lok = lokasi.id_loc JOIN user ON sewa.id_user = user.user_id JOIN ps_sewa ON sewa.id_ps = ps_sewa.id_ps JOIN jenis ON ps_sewa.jenis = jenis.id_jenis WHERE sewa.status = 'batal' AND sewa.id_user = ? ORDER BY sewa.waktu_order DESC`,
            [authToken.userId]
          )
          .then((chunk) => {
            chunk.forEach((element: any) => {
              result.push({
                orderId: element.id_sewa,
                playstationId: element.id_ps,
                playstationType: element.nama_jenis,
                status: element.status,
                shipmentMethod: element.pil_kirim,
                orderTime: element.waktu_order,
                startTime: element.waktu_mulai,
                finishTime: element.waktu_selesai,
                playtime: element.playtime,
                totalAmount: element.bayar,
                paymentMethod: element.payment_method,
                address: element.address,
                gameCenter: element.nama_loc,
                location: element.lok,
                userId: element.user_id,
                email: element.email,
                username: element.username,
                phoneNumber: element.hp,
                description: element.description,
              });
            });
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

  public static async getOrderAtHomeDetailById(
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
          const { rentalId } = JSON.parse(requestBody);

          await connection
            .select(
              `SELECT sewa.id_sewa, sewa.status, sewa.waktu_order, sewa.mulai_sewa, sewa.akhir_sewa, sewa.playtime, sewa.bayar, sewa.payment_method, sewa.pil_kirim, sewa.address, sewa.description, lokasi.nama_loc, jenis.nama_jenis, user.user_id, user.username, user.email, user.hp FROM sewa JOIN lokasi ON sewa.lok = lokasi.id_loc JOIN ps_sewa ON sewa.id_ps = ps_sewa.id_ps JOIN jenis ON ps_sewa.jenis = jenis.id_jenis JOIN user ON sewa.id_user = user.user_id WHERE id_sewa = ? AND id_user = ?`,
              [rentalId, authToken.userId]
            )
            .then(async (chunk) => {
              if (chunk) {
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

export default HistoryRoute;
