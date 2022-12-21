import http from "http";
import fs from "fs";
import path from "path";
import * as nodeStatic from "node-static";

import SQLConnection from "../config/sql-connection";
import RestAPIFormat from "../utils/rest-api-format";
import AuthAccessToken from "../utils/auth-access-token";

import formidable from "formidable";

const connection = SQLConnection.getInstance();
connection.getConnection();

const fileServer = new nodeStatic.Server("./public");

class ImagesRoute {
  constructor() {}

  public static getStaticFile(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    fileServer.serve(req, res);
    return;
  }

  public static async getImage(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = JSON.parse(
      AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
    );

    let userData: any;

    await connection
      .select(`SELECT * FROM user WHERE email=?`, [token.email])
      .then((chunk) => {
        userData = chunk;
      });

    const filePath = path.join(
      __dirname,
      `../assets/images/${token.email}/${userData.img}`
    );

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(RestAPIFormat.status404(err)));
        return;
      }

      res.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Content-Length": data.length,
      });
      res.end(data);
    });
  }

  public static async uploadImage(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const form = new formidable.IncomingForm({});

    form.parse(req, async (err, fields, files: any) => {
      const token = JSON.parse(
        AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
      );

      let userData: any;

      await connection
        .select(`SELECT * FROM user WHERE email=?`, [token.email])
        .then((chunk) => {
          userData = chunk;
        });

      const oldPath = files.file.filepath;
      const newPath = path.join(
        __dirname,
        `../assets/images/${token.email}/${userData.img}`
      );

      fs.copyFile(oldPath, newPath, (err) => {
        if (err) throw err;
      });

      const result = JSON.stringify(
        RestAPIFormat.status201(
          {
            userId: userData.userId,
            email: userData.email,
            hashedPassword: userData.hashedPassword,
            username: userData.username,
            phone: userData.phone,
            images: userData.img,
            create_at: userData.create_at,
            update_at: userData.update_at,
            token: userData.cookies,
            addressId: userData.addressId,
          },
          "Upload image success"
        )
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(result);
    });
  }
}

export default ImagesRoute;
