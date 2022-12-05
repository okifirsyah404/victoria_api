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
}

export default HomeContentRoute;
