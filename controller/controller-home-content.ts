import http from "http";
import fs from "fs";
import path from "path";

import SQLConnection from "../config/sql-connection";
import RestAPIFormat from "../utils/rest-api-format";
import AuthAccessToken from "../utils/auth-access-token";

import formidable from "formidable";
import ParseJSON from "../utils/json-parse";

const connection = SQLConnection.getInstance();
connection.getConnection();

class HomeContentRoute {
  public static async getHomeContentUser(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = JSON.parse(
      AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
    );

    await connection
      .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
      .then((chunk) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(
            RestAPIFormat.status200(
              {
                userId: chunk.user_id,
                email: chunk.email,
                username: chunk.username,
                phone: chunk.hp,
                image: chunk.img,
                token: req.headers.authorization,
                ballance: chunk.saldo,
                playTime: chunk.playtime,
                create_at: chunk.create_at,
                update_at: chunk.update_at,
              },
              "Success get user data"
            )
          )
        );
      })
      .catch((err) => {
        res.writeHead(404);
        res.end(JSON.stringify(RestAPIFormat.status404(err)));
      });
  }

  public static async getGameCenterList(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = JSON.parse(
      AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
    );

    await connection
      .selectAll(`SELECT * FROM lokasi`, [token.userId])
      .then((chunk) => {
        let result: any[] = [];

        chunk.forEach((element: any) => {
          result.push({
            id: element.id_loc,
            name: element.nama_loc,
            address: element.address,
            latitude: element.latitude,
            longitude: element.longitude,
          });
        });

        console.log(result);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(
            RestAPIFormat.status200(result, "Success get game center list")
          )
        );
      })
      .catch((err) => {
        res.writeHead(404);
        res.end(JSON.stringify(RestAPIFormat.status404(err)));
      });
  }

  // public static async getGameCenterDetailPlaystation3(
  //   req: http.IncomingMessage,
  //   res: http.ServerResponse
  // ): Promise<void> {
  //   const token = JSON.parse(
  //     AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
  //   );

  //   await connection
  //     .select(`SELECT COUNT(id_ps) FROM ps WHERE jenis = 'ps3'`, [token.userId])
  //     .then((chunk) => {
  //       res.writeHead(200, { "Content-Type": "application/json" });
  //       res.end(
  //         JSON.stringify(
  //           RestAPIFormat.status200(
  //             {
  //               ps3: chunk["COUNT(id_ps)"],
  //             },
  //             "Success get detail playstation 3"
  //           )
  //         )
  //       );
  //     })
  //     .catch((err) => {
  //       res.writeHead(404);
  //       res.end(JSON.stringify(RestAPIFormat.status404(err)));
  //     });
  // }

  // public static async getGameCenterDetailPlaystation4(
  //   req: http.IncomingMessage,
  //   res: http.ServerResponse
  // ) {
  //   const token = JSON.parse(
  //     AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
  //   );

  //   await connection
  //     .select(`SELECT COUNT(id_ps) FROM ps WHERE jenis = 'ps4'`, [token.userId])
  //     .then((chunk) => {
  //       res.writeHead(200, { "Content-Type": "application/json" });
  //       res.end(
  //         JSON.stringify(
  //           RestAPIFormat.status200(
  //             {
  //               ps4: chunk["COUNT(id_ps)"],
  //             },
  //             "Success get detail playstation 4"
  //           )
  //         )
  //       );
  //     })
  //     .catch((err) => {
  //       res.writeHead(404);
  //       res.end(JSON.stringify(RestAPIFormat.status404(err)));
  //     });
  // }

  public static async getGameCenterPSList(
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
        let psData: any;

        await connection
          .selectAll(`SELECT * FROM ps WHERE lok = ? `, [location])
          .then(async (chunk) => {
            psData = chunk;

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
            res.writeHead(404);
            res.end(JSON.stringify(RestAPIFormat.status404(err)));
          });
      });
    }
  }
}

export default HomeContentRoute;
