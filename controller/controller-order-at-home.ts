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

class OrderAtHomeRoute {
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

        let result = [];

        // await connection.
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify(RestAPIFormat.status401("Unauthorized")));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status500(error)));
    }
  }

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
}

export default OrderAtHomeRoute;
