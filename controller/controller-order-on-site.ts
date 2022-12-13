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
  public static async postOrderOnSiteDataById(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    // const token = req.headers.authorization;
    const token = true;

    if (token) {
      // const authToken = JSON.parse(
      //   AuthAccessToken.checkAccessToken(token) ?? ""
      // );

      let requestBody: string;

      req.on("data", async (chunk) => {
        requestBody = ParseJSON.JSONtoObject(chunk);
      });
      req.on("end", async () => {
        const {
          // userId,
          // playtime,
          // startPlay,
          // endPlay,
          // paymentMethod,
          // playstationId,
        } = JSON.parse(requestBody);

        // const today = new Date();
        const date = new Date();
        const today = new Date(Date.parse(date.toString()));

        let formattedDate = today.toLocaleString("id-ID", {
          day: "numeric",
          month: "numeric",
          year: "2-digit",
        });

        const newFormattedDate: String = formattedDate.replace(/\//g, "");
        console.log(newFormattedDate);
        let rentalData: any;

        await connection
          .select(
            `SELECT MAX(id_rental) AS id FROM rental where id_rental LIKE '%${newFormattedDate}%' ORDER BY id_rental DESC`
            // [newFormattedDate]
          )
          .then((chunk) => {
            rentalData = chunk;
          });

        console.log(rentalData);
        console.log(rentalData[0]);

        // if (rentalData[0].id) {
        //   const oldRentalId = rentalData[0].id;
        //   const regexp = /RT(\d{3})/;

        //   const matches = oldRentalId.match(regexp);
        //   const number = matches[1];
        //   let getIntId = parseInt(number);

        //   const rentalId = `TR${++getIntId}-${newFormattedDate}`;

        //   res.writeHead(200, { "Content-Type": "application/json" });
        //   res.end(JSON.stringify(RestAPIFormat.status200({ rentalId })));
        // } else {
        //   const rentalId = `TR001-${newFormattedDate}`;
        //   const rentalData = {
        //     rentalId: rentalId,
        //     userId: 1,
        //     playtime: 1,
        //     startPlay: 1,
        //     endPlay: 1,
        //     paymentMethod: 1,
        //     playstationId: 1,
        //     date: 1
        //   }

        //   await connection
        //     .insert(`INSERT INTO `)

        if (rentalData[0]) {
          const oldRentalId = rentalData[0].id;
          const regexp = /RT(\d{3})/;

          const matches = oldRentalId.match(regexp);
          const number = matches[1];
          let getIntId = parseInt(number);

          const rentalId = `TR${++getIntId}-${newFormattedDate}`;

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(RestAPIFormat.status200({ rentalId })));
        } else {
          const rentalId = `TR001-${newFormattedDate}`;

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(RestAPIFormat.status200({ rentalId })));
        }
      });
    }
  }
}

export default OrderOnSiteRoute;
