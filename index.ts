import http from "http";
import * as dotenv from "dotenv";

import SQLConnection from "./config/sql-connection";
import AuthRoute from "./controller/controller-auth";
import ImagesRoute from "./controller/controller-images";
import RouteUser from "./controller/controller-user";
import HomeContentRoute from "./controller/controller-home-content";

dotenv.config();
const connection = SQLConnection.getInstance().getConnection();

const server = http.createServer((req, res) => {
  const { url, method } = req;

  switch (url) {
    case "/":
      if (method == "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify({ message: "Hello World" }));
        res.end();
      }
      break;

    case "/api/auth/signin":
      if (method == "POST") {
        AuthRoute.signInResponse(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/auth/signup":
      if (method == "POST") {
        AuthRoute.signUpResponse(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/auth/signup/verify":
      if (method == "POST") {
        AuthRoute.signUpEmailResponse(req, res);
      }
      break;

    case "/api/auth/signout":
      if (method == "GET") {
        AuthRoute.signOutResponse(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/images":
      if (method == "GET") {
        ImagesRoute.getImage(req, res);
      } else if (method == "POST") {
        ImagesRoute.uploadImage(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/user":
      if (method == "GET") {
        RouteUser.getUser(req, res);
      } else if (method == "POST") {
        RouteUser.updateUser(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/user/image":
      if (method == "GET") {
        RouteUser.getUserImage(req, res);
      } else if (method == "POST") {
        RouteUser.uploadUserImage(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/home-content":
      // TODO: add method
      break;

    case "/api/home/user":
      if (method == "GET") {
        HomeContentRoute.getHomeContentUser(req, res);
      }
      break;

    default:
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));

      break;
  }
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}/`);
});
