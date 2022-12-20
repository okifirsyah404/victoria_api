import http from "http";
import fs from "fs";
import path from "path";

import SQLConnection from "../config/sql-connection";
import RestAPIFormat from "../utils/rest-api-format";
import AuthAccessToken from "../utils/auth-access-token";
import ParseJSON from "../utils/json-parse";

const connection = SQLConnection.getInstance();
connection.getConnection();

class GamecenterRoute {
  public static async getGameCenterDataById(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
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
        const { location } = JSON.parse(requestBody);
        let locationData: any;
        let psData: any[] = [];

        await connection
          .selectAll(
            `SELECT ps.id_ps, ps.nama_ps, ps.lok, ps.status, jenis.nama_jenis, ps.harga, rental.id_rental, rental.mulai_rental, rental.selesai_rental FROM ps JOIN jenis ON ps.jenis = jenis.id_jenis JOIN rental ON rental.id_ps = ps.id_ps WHERE rental.mulai_rental <= CURRENT_TIMESTAMP AND rental.selesai_rental >= CURRENT_TIMESTAMP AND ps.lok = ? ORDER BY rental.mulai_rental DESC;`,
            [location]
          )
          .then(async (chunk) => {
            await connection.update("UPDATE ps SET status = ? WHERE lok = ?", [
              "tidak aktif",
              location,
            ]);

            if (chunk) {
              chunk.forEach(async (element: any) => {
                await connection.update(
                  "UPDATE ps SET status = ? WHERE id_ps = ?",
                  ["aktif", element.id_ps]
                );
              });
            }
          });

        await connection
          .selectAll(
            `SELECT ps.id_ps, ps.nama_ps, ps.lok, ps.status, jenis.nama_jenis, ps.harga FROM ps JOIN jenis ON ps.jenis = jenis.id_jenis WHERE lok = ?; `,
            [location]
          )
          .then(async (chunk) => {
            chunk.forEach((element: any) => {
              psData.push({
                id: element.id_ps,
                name: element.nama_ps,
                type: element.nama_jenis,
                location: element.lok,
                status: element.status,
                price: element.harga,
              });
            });

            let ps3 = 0;
            let ps4 = 0;

            await connection
              .select(`SELECT * FROM lokasi WHERE id_loc=?`, [location])
              .then((data) => {
                locationData = data;
              });

            await connection
              .select(
                `SELECT COUNT(id_ps) FROM ps WHERE jenis = 'ps3' AND lok = ?`,
                [location]
              )
              .then((data) => {
                ps3 = data["COUNT(id_ps)"];
              })
              .catch((err) => {
                throw err;
              });
            await connection
              .select(
                `SELECT COUNT(id_ps) FROM ps WHERE jenis = 'ps4' AND lok = ?`,
                [location]
              )
              .then((data) => {
                ps4 = data["COUNT(id_ps)"];
              })
              .catch((err) => {
                throw err;
              });

            const result = {
              name: locationData.nama_loc,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              playstation3: ps3,
              playstation4: ps4,
              playstationTotal: ps3 + ps4,
              playstationList: psData,
            };

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify(
                RestAPIFormat.status200(
                  result,
                  "Success get game center PS List"
                )
              )
            );
          })
          .catch((err) => {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify(RestAPIFormat.status404(err)));
          });
      });
    }
  }

  public static async getGameCenterImageById(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = req.headers.authorization;

    if (token) {
      let requestBody: string;

      req.on("data", async (chunk) => {
        requestBody = ParseJSON.JSONtoObject(chunk);
      });

      req.on("end", async () => {
        const { id } = JSON.parse(requestBody);

        await connection
          .select(`SELECT * FROM lokasi WHERE id_loc = ?`, [id])
          .then((data) => {
            const filePath = path.join(
              __dirname,
              `../assets/location/${data.id_loc}/${data.image}`
            );

            fs.readFile(filePath, (err, imageData) => {
              if (err) {
                throw err;
              } else {
                res.writeHead(200, {
                  "Content-Type": "image/png",
                  "Content-Length": imageData.length,
                });
                res.end(imageData);
              }
            });
          })
          .catch((err) => {
            res.writeHead(404);
            res.end(JSON.stringify(RestAPIFormat.status404(err)));
          });
      });
    }
  }
}

export default GamecenterRoute;
