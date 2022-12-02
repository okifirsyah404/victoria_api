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

class RouteUser {
  public static async getUser(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = JSON.parse(
      AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
    );

    await connection
      .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
      .then((chunk) => {
        res.writeHead(200);
        res.end(
          JSON.stringify(
            RestAPIFormat.status200({
              userId: chunk.user_id,
              email: chunk.email,
              username: chunk.username,
              phone: chunk.hp,
              address: chunk.id_address,
              image: chunk.img,
              token: token,
              ballance: chunk.saldo,
              create_at: chunk.create_at,
              update_at: chunk.update_at,
            })
          )
        );
      })
      .catch((err) => {
        res.writeHead(404);
        res.end(JSON.stringify(RestAPIFormat.status404(err)));
      });
  }

  public static async getUserImage(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = JSON.parse(
      AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
    );

    let userData: any;

    await connection
      .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
      .then((chunk) => {
        userData = chunk;
      });

    const filePath = path.join(
      __dirname,
      `..\\assets\\images\\${userData.user_id.replace(/-/gi, "")}\\${
        userData.img
      }`
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

  public static async updateUser(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const token = JSON.parse(
      AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
    );

    req.on("data", async (chunk) => {
      const requestBody = ParseJSON.JSONtoObject(chunk);
      const { username, phone, email } = JSON.parse(requestBody);
      let newToken: string;

      await connection
        .select(`SELECT * FROM user WHERE email=?`, [token.email])
        .then(async (chunk) => {
          console.log(chunk);

          if (username) {
            await connection.update(
              `UPDATE user SET username=? WHERE email=?`,
              [username, token.email]
            );
          }
          if (phone) {
            await connection.update(`UPDATE user SET hp=? WHERE email=?`, [
              phone,
              token.email,
            ]);
          }
          if (email) {
            await connection.update(`UPDATE user SET email=? WHERE email=?`, [
              email,
              token.email,
            ]);

            newToken = AuthAccessToken.createAccessToken({
              email: email || chunk.email,
              username: chunk.username,
            });

            await connection.update(`UPDATE user SET cookies=? WHERE email=?`, [
              newToken,
              email || token.email,
            ]);
          }

          connection
            .select(`SELECT * FROM user WHERE email=?`, [email || token.email])
            .then((chunk) => {
              res.writeHead(200);
              res.end(
                JSON.stringify(
                  RestAPIFormat.status200({
                    userId: chunk.user_id,
                    email: chunk.email,
                    username: chunk.username,
                    phone: chunk.hp,
                    address: chunk.id_address,
                    image: chunk.img,
                    token: newToken,
                  })
                )
              );
            });
          // .catch((err) => {
          //   throw err;
          // });
        })
        .catch((err) => {
          console.log(err);
          if (err.errno == 1062) {
            res.end(
              JSON.stringify(
                RestAPIFormat.status400(err, "Email already exist")
              )
            );
          } else {
            res.end(JSON.stringify({ error: err }));
          }
        });
    });
  }

  public static async uploadUserImage(
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
        `..\\assets\\images\\${token.email}\\${userData.img}`
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

export default RouteUser;
