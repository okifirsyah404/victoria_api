import http from "http";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

import SQLConnection from "../config/sql-connection";
import ParseJSON from "../utils/json-parse";
import RestAPIFormat from "../utils/rest-api-format";
import AuthAccessToken from "../utils/auth-access-token";

const saltRounds = 10;

const connection = SQLConnection.getInstance();
connection.getConnection();

class AuthRoute {
  constructor() {}

  public static async signInResponse(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    let requestBody: string;

    req.on("data", async (chunk) => {
      requestBody = ParseJSON.JSONtoObject(chunk);
    });

    req.on("end", () => {
      const { email, password } = JSON.parse(requestBody);
      connection
        .select(`SELECT * FROM user WHERE email=? `, [email])
        .catch((err) => {
          console.log(err);
        })
        .then((chunk) => {
          const verifyPassword = bcrypt.compareSync(password, chunk.password);

          const token = AuthAccessToken.createAccessToken({
            email: chunk.email,
            username: chunk.username,
          });

          connection.update(`UPDATE user SET cookies=? WHERE email=?`, [
            token,
            chunk.email,
          ]);

          if (verifyPassword) {
            const result = JSON.stringify(
              RestAPIFormat.status200(
                {
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
                },
                "Sign in success"
              )
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(result);
          } else {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify(RestAPIFormat.status401({}, "Wrong password"))
            );
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  public static async signUpResponse(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    req.on("data", async (chunk) => {
      const requestBody = ParseJSON.JSONtoObject(chunk);
      const { email, password, username, phone } = JSON.parse(requestBody);
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const token = AuthAccessToken.createAccessToken({ email, username });
      const userId = uuidv4();
      const addressId = "";
      const userBalance = 0;
      const create_at = new Date();
      const update_at = new Date();

      connection
        .insert(
          `INSERT INTO user (user_id, email, username, hp, password, cookies, create_at, update_at, saldo, playtime, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            email,
            username,
            phone,
            hashedPassword,
            token,
            create_at,
            update_at,
            userBalance,
            0,
            "hei",
          ]
        )
        .catch((err) => {
          res.writeHead(500, { "Content-Type": "application/json" });
          if (err.errno == 1062) {
            res.end(
              JSON.stringify(
                RestAPIFormat.status400(err, "Email already exist")
              )
            );
          } else {
            res.end(JSON.stringify({ error: err }));
          }
        })
        .then((chunk) => {
          const fileName = `${email}`.substring(0, `${email}`.indexOf("@"));

          try {
            fs.mkdir(
              path.join(__dirname, `..\\assets\\images\\${email}`),
              (err) => {
                if (err) {
                  console.log(err);
                }
              }
            );

            fs.copyFile(
              path.join(
                __dirname,
                `..\\assets\\images\\avatar-profile-100.jpg`
              ),
              path.join(
                __dirname,
                `..\\assets\\images\\${email}\\${fileName}-profile.jpg`
              ),
              (err) => {
                if (err) throw err;
              }
            );

            connection.update(`UPDATE user SET img=? WHERE email=?`, [
              `${fileName}-profile.jpg`,
              email,
            ]);
          } catch (error) {}

          const result = JSON.stringify(
            RestAPIFormat.status201(
              {
                userId,
                email,
                username,
                phone,
                images: `${fileName}-profile.jpg`,
                create_at,
                update_at,
                token,
              },
              "Sign up success"
            )
          );

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(result);
        });
    });
  }

  public static async signOutResponse(
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

    if (req.headers.authorization == userData.cookies) {
      connection.update(`UPDATE user SET cookies=? WHERE email=?`, [
        "",
        token.email,
      ]);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status200({}, "Sign out success")));
    } else {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify(RestAPIFormat.status401({}, "Unauthorized")));
    }
  }
}

export default AuthRoute;
