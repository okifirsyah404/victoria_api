// import http from "http";
// import fs from "fs";
// import path from "path";

// import SQLConnection from "../config/sql-connection";
// import RestAPIFormat from "../utils/rest-api-format";
// import AuthAccessToken from "../utils/auth-access-token";
// import ParseJSON from "../utils/json-parse";
// import bcrypt from "bcrypt";
// import Connection from "mysql2/typings/mysql/lib/Connection";

// class OrderAtHomeRoute {
//   public static async getOrderAtHomeData(
//     req: http.IncomingMessage,
//     res: http.ServerResponse
//   ) {
//     const token = req.headers.authorization;

//     try {
//       if (token) {
//         let requestBody: string;
        

//         req.on("data", async (chunk) => {
//           requestBody = ParseJSON.JSONtoObject(chunk);
//         });

//         req.on("end", async () => {
//           const { playstationId, OrderAtHomeId } = JSON.parse(requestBody);

//           let OrderAtHomeData: any;
//           let playstationData: any;

//           await connection
//           .select("SELECT *   ")

//       });

//   }
// }

// export default OrderAtHomeRoute;
