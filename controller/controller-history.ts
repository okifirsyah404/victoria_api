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
            console.log(chunk);
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
}

export default HistoryRoute;
