"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const dotenv = __importStar(require("dotenv"));
const sql_connection_1 = __importDefault(require("./config/sql-connection"));
const controller_auth_1 = __importDefault(require("./controller/controller-auth"));
const controller_images_1 = __importDefault(require("./controller/controller-images"));
const controller_user_1 = __importDefault(require("./controller/controller-user"));
dotenv.config();
const connection = sql_connection_1.default.getInstance().getConnection();
const server = http_1.default.createServer((req, res) => {
    const { url, method } = req;
    switch (url) {
        case "/auth/signin":
            if (method == "POST") {
                controller_auth_1.default.signInResponse(req, res);
            }
            else {
                res.writeHead(405, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Method not allowed" }));
            }
            break;
        case "/auth/signup":
            if (method == "POST") {
                controller_auth_1.default.signUpResponse(req, res);
            }
            else {
                res.writeHead(405, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Method not allowed" }));
            }
            break;
        case "/auth/signout":
            if (method == "GET") {
                controller_auth_1.default.signOutResponse(req, res);
            }
            else {
                res.writeHead(405, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Method not allowed" }));
            }
            break;
        case "/images":
            if (method == "GET") {
                controller_images_1.default.getImage(req, res);
            }
            else if (method == "POST") {
                controller_images_1.default.uploadImage(req, res);
            }
            else {
                res.writeHead(405, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Method not allowed" }));
            }
            break;
        case "/user":
            if (method == "GET") {
                controller_user_1.default.getUser(req, res);
            }
            else if (method == "POST") {
                controller_user_1.default.updateUser(req, res);
            }
            else {
                res.writeHead(405, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Method not allowed" }));
            }
            break;
        case "/user/image":
            if (method == "GET") {
                controller_user_1.default.getUserImage(req, res);
            }
            else if (method == "POST") {
                controller_user_1.default.uploadUserImage(req, res);
            }
            else {
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
