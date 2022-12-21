import http from "http";
import fs from "fs";
import path from "path";

import SQLConnection from "../config/sql-connection";
import RestAPIFormat from "../utils/rest-api-format";
import AuthAccessToken from "../utils/auth-access-token";
import ParseJSON from "../utils/json-parse";
import { match } from "assert";

const connection = SQLConnection.getInstance();
connection.getConnection();

class ServicesRoute {
  public static async postServiceData(
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
            serviceId,
            serviceName,
            problem,
            serviceDetail,
            timeSubmit,
            serviceStatus,
            lok,
            estimatedEndTime,
          } = JSON.parse(requestBody);

          let serviceData: any;
          let newServiceId: string;

          await connection
            .select(`SELECT * FROM servis WHERE id_servis`, [serviceId])
            .then((chunk) => {
              serviceData = chunk;
            })
            .catch((err) => {
              throw err;
            });

          if (serviceData.id) {
            const oldServiceId = serviceData.id;

            const regexp = /(\d+)/g;
            const matches = oldServiceId.match(regexp);
            const number = matches[1];
            let getIntId = parseInt(number);

            newServiceId = `SV00${getIntId + 1}`;
          } else {
            newServiceId = `SV001`;
          }

          await connection
            .insert(
              `INSERT INTO servis (id_servis, nama_barang, kerusakan, detail, waktu_submit, status, est_selesai, lok, id_user) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                newServiceId,
                serviceId,
                serviceName,
                problem,
                serviceDetail,
                timeSubmit,
                serviceStatus,
                estimatedEndTime,
                lok,
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
                  serviceId: newServiceId,
                },
                "Service data has been successfully submitted."
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
}

//   public static async getServiceDataById(
//     req: http.IncomingMessage,
//     res: http.ServerResponse
//   ) {
//     const token = req.headers.authorization;

//     try {
//       if (token) {
//         const authToken = JSON.parse(
//           AuthAccessToken.checkAccessToken(token) ?? ""
//         );

//         await connection
//           .select(
//             `SELECT * FROM servis WHERE id_user = ?`,
//             [authToken.userId]
//           )
//           .then((chunk) => {
//             res.writeHead(200, { "Content-Type": "application/json" });
//             res.end(
//               JSON.stringify(
//                 RestAPIFormat.status200({
//                   serviceId: chunk.id_servis,
//                   serviceName: chunk.nama_barang,
//                   problem: chunk.kerusakan,
//                   serviceDetail: chunk.detail,
//                   timeSubmit: chunk.waktu_submit,
//                   serviceStatus: chunk.status,
//                   estimatedEndTime: chunk.est_selesai,
//                 })
//               )
//             );
//           })
//           .catch((err) => {
//             throw(err);
//           });
//       } else {
//         res.writeHead(401);
//         res.end(JSON.stringify(RestAPIFormat.status401("Unauthorized")));
//       }
//     } catch (error) {
//       res.writeHead(500);
//       res.end(JSON.stringify(RestAPIFormat.status500(error)));
//     }
//   }
// }

//   public static async getServiceData(
//   req: http.IncomingMessage,
//   res: http.ServerResponse
// ) {
//   const token = req.headers.authorization;

//   try {
//     if (token) {
//       let requestBody: string;

//       req.on("data", async (chunk) => {
//         requestBody = ParseJSON.JSONtoObject(chunk);
//       });

//       let getServiceData: any;

//       await connection
//         .select(`SELECT * FROM servis WHERE id_user = ?`, [authToken.userId])
//         .then((chunk) => {
//           getServiceData = chunk;
//         })

//         await connection
//         .select(`SELECT id_servis, nama_barang, kerusakan, detail, waktu_submit, status, est_selesai, lok, id_servis FROM servis JOIN lokasi ON servis.lok = lokasi.id_loc WHERE id_user = ?`, [])

export default ServicesRoute;
