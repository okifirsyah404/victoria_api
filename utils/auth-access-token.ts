import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import http, { IncomingHttpHeaders } from "http";
import RestAPIFormat from "./rest-api-format";

dotenv.config();

class AuthAccessToken {
  private static instance: AuthAccessToken;

  private constructor() {}

  public static createAccessToken(payload: any): string {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET ?? "", {
      expiresIn: "30d",
    });
  }

  public static checkAccessToken(auth: string | undefined): string | undefined {
    let loadedPayload: string | undefined;

    if (auth) {
      jwt.verify(auth, process.env.ACCESS_TOKEN_SECRET!, (err, payload) => {
        loadedPayload = JSON.stringify(payload);
      });
      return loadedPayload;
    }
    return undefined;
  }

  public static authenticateAccessToken(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: any
  ) {
    const auth = req.headers.authorization;

    if (auth) {
      jwt.verify(auth, process.env.ACCESS_TOKEN_SECRET!, (err, payload) => {
        if (err) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(RestAPIFormat.status403({}, "Forbidden"));
        } else {
          next();
        }
      });
    }
  }
}

export default AuthAccessToken;
