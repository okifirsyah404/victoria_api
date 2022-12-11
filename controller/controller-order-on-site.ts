import http from "http";
import fs from "fs";
import path from "path";

import SQLConnection from "../config/sql-connection";
import RestAPIFormat from "../utils/rest-api-format";
import AuthAccessToken from "../utils/auth-access-token";
import ParseJSON from "../utils/json-parse";

const connection = SQLConnection.getInstance();
connection.getConnection();

class OrderOnSiteRoute {
  public static async getOrderOnSiteDataById(
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
    }
  }
}

export default OrderOnSiteRoute;
