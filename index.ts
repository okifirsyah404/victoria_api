import http from "http";
import * as dotenv from "dotenv";
import path from "path";
import admin from "firebase-admin";

import SQLConnection from "./config/sql-connection";
import AuthRoute from "./controller/controller-auth";
import ImagesRoute from "./controller/controller-images";
import RouteUser from "./controller/controller-user";
import HomeContentRoute from "./controller/controller-home-content";
import GameCenterRoute from "./controller/controller-game-center";
import OrderOnSiteRoute from "./controller/controller-order-on-site";
import HistoryRoute from "./controller/controller-history";
import ServicesRoute from "./controller/controller-service";
import OrderAtHomeRoute from "./controller/controller-order-at-home";

dotenv.config();
const connection = SQLConnection.getInstance().getConnection();

admin.initializeApp({
  credential: admin.credential.cert(
    path.join(
      __dirname,
      "victoria-tolonto-firebase-adminsdk-rfxz3-642e925949.json"
    )
  ),
});

const server = http.createServer((req, res) => {
  const { url, method } = req;

  switch (url) {
    case "/":
      if (method == "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify({ message: "Hello World" }));
        res.end();
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
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
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/auth/forgot-password":
      if (method == "PUT") {
        AuthRoute.forgotPasswordResponse(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/auth/forgot-password/verify":
      if (method == "POST") {
        AuthRoute.forgotPasswordOtpResponse(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
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
      if (method == "POST") {
        RouteUser.getUser(req, res);
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

    case "/api/user/image/id":
      if (method == "POST") {
        RouteUser.getUserImageById(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/user/username":
      if (method == "PUT") {
        RouteUser.updateUsername(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/user/password/verify":
      if (method == "GET") {
        RouteUser.sendOtpUpdatePassword(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/user/password":
      if (method == "PUT") {
        RouteUser.updatePassword(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/user/phone":
      if (method == "PUT") {
        RouteUser.updatePhone(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/home-content":
      if (method == "GET") {
        HomeContentRoute.getHomeContentUser(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/home-content/game-center-list":
      if (method == "GET") {
        HomeContentRoute.getGameCenterList(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/game-center/image":
      if (method == "POST") {
        GameCenterRoute.getGameCenterImageById(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/game-center/detail":
      if (method == "POST") {
        GameCenterRoute.getGameCenterDataById(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/home/user":
      if (method == "GET") {
        HomeContentRoute.getHomeContentUser(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/on-site":
      if (method == "POST") {
        OrderOnSiteRoute.postOrderOnSiteDataById(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/on-site/all-time":
      if (method == "POST") {
        OrderOnSiteRoute.getAllTimeOrderOnSiteData(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/on-site/summary":
      if (method == "POST") {
        OrderOnSiteRoute.getOrderOnSiteData(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/on-site/verify":
      if (method == "POST") {
        OrderOnSiteRoute.verifyOrderOnSiteData(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/on-site/detail":
      if (method == "POST") {
        OrderOnSiteRoute.getOrderOnSiteDataById(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/service":
      if (method == "POST") {
        ServicesRoute.postServiceData(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/service/verify":
      if (method == "POST") {
        ServicesRoute.verifyServiceData(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/service/detail":
      if (method == "POST") {
        ServicesRoute.getServiceDataById(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/at-home/playstation-types":
      if (method == "GET") {
        OrderAtHomeRoute.getOrderAtHomePlaystationTypes(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/at-home/playstation-type":
      if (method == "POST") {
        OrderAtHomeRoute.getOrderAtHomePlaystationType(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/at-home/playstation-list":
      if (method == "POST") {
        OrderAtHomeRoute.getOrderAtHomePlaystationList(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/at-home/playstation-detail":
      if (method == "POST") {
        OrderAtHomeRoute.getOrderAtHomePlaystationDetail(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/at-home/verify":
      if (method == "POST") {
        OrderAtHomeRoute.verifyOrderAtHomeData(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/at-home":
      if (method == "POST") {
        OrderAtHomeRoute.postOrderAtHome(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/order/at-home/detail":
      if (method == "POST") {
        OrderAtHomeRoute.getOrderAtHomeById(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/on-site/current":
      if (method == "GET") {
        HistoryRoute.getCurrentOrderOnSite(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/on-site/previous":
      if (method == "GET") {
        HistoryRoute.getPreviousOrderOnSite(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/on-site/future":
      if (method == "GET") {
        HistoryRoute.getFutureOrderOnSite(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/on-site/detail":
      if (method == "POST") {
        HistoryRoute.getOrderOnSiteDetails(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/service/pending":
      if (method == "GET") {
        HistoryRoute.getPendingPlaystationService(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/service/progress":
      if (method == "GET") {
        HistoryRoute.getProgressPlaystationService(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/service/canceled":
      if (method == "GET") {
        HistoryRoute.getCanceledPlaystationService(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/service/finished":
      if (method == "GET") {
        HistoryRoute.getFinishedPlaystationService(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/service/detail":
      if (method == "POST") {
        HistoryRoute.getPlaystationServiceDetailById(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/at-home/pending":
      if (method == "GET") {
        HistoryRoute.getPendingOrderAtHome(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/at-home/active":
      if (method == "GET") {
        HistoryRoute.getActiveOrderAtHome(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/at-home/finished":
      if (method == "GET") {
        HistoryRoute.getFinishedOrderAtHome(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/at-home/canceled":
      if (method == "GET") {
        HistoryRoute.getCanceledOrderAtHome(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
      break;

    case "/api/history/at-home/detail":
      if (method == "POST") {
        HistoryRoute.getOrderAtHomeDetailById(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
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
