"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sql_connection_1 = __importDefault(require("../config/sql-connection"));
const json_parse_1 = __importDefault(require("../utils/json-parse"));
const rest_api_format_1 = __importDefault(require("../utils/rest-api-format"));
const auth_access_token_1 = __importDefault(require("../utils/auth-access-token"));
const controller_email_1 = __importDefault(require("../utils/controller-email"));
const saltRounds = 10;
const connection = sql_connection_1.default.getInstance();
connection.getConnection();
let OTP = "";
class AuthRoute {
    constructor() { }
    static signInResponse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let requestBody;
            req.on("data", (chunk) => __awaiter(this, void 0, void 0, function* () {
                requestBody = json_parse_1.default.JSONtoObject(chunk);
            }));
            req.on("end", () => {
                const { email, password } = JSON.parse(requestBody);
                connection
                    .select(`SELECT * FROM user WHERE email=? `, [email])
                    .then((chunk) => __awaiter(this, void 0, void 0, function* () {
                    if (chunk) {
                        let verifyPassword = bcrypt_1.default.compareSync(password, chunk.password);
                        const token = auth_access_token_1.default.createAccessToken({
                            userId: chunk.user_id,
                            email: chunk.email,
                        });
                        connection.update(`UPDATE user SET cookies=? WHERE email=?`, [
                            token,
                            chunk.email,
                        ]);
                        if (verifyPassword) {
                            const result = JSON.stringify(rest_api_format_1.default.status200({
                                userId: chunk.user_id,
                                email: chunk.email,
                                username: chunk.username,
                                phone: chunk.hp,
                                image: chunk.img,
                                token: token,
                                ballance: chunk.saldo,
                                playtime: chunk.playtime,
                                create_at: chunk.create_at,
                                update_at: chunk.update_at,
                            }, "Sign in success"));
                            res.writeHead(200, { "Content-Type": "application/json" });
                            res.end(result);
                        }
                        else {
                            res.writeHead(401, { "Content-Type": "application/json" });
                            res.end(JSON.stringify(rest_api_format_1.default.status401({}, "Wrong password")));
                        }
                    }
                    else {
                        res.writeHead(401, { "Content-Type": "application/json" });
                        res.end(JSON.stringify(rest_api_format_1.default.status401({}, "Email not registered")));
                    }
                }))
                    .catch((err) => {
                    console.log(err);
                });
            });
        });
    }
    static signUpEmailResponse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            req.on("data", (chunk) => __awaiter(this, void 0, void 0, function* () {
                const requestBody = json_parse_1.default.JSONtoObject(chunk);
                const { email, password, username, phone } = JSON.parse(requestBody);
                OTP = Math.floor(100000 + Math.random() * 900000).toString();
                connection
                    .select(`SELECT * FROM user WHERE email=?`, [email])
                    .then((chunk) => {
                    if (!chunk) {
                        controller_email_1.default.sendEmailVerification(email, OTP);
                        const result = JSON.stringify(rest_api_format_1.default.status200({
                            OTP,
                        }, "Sign up in progress"));
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(result);
                    }
                    else {
                        res.writeHead(401, { "Content-Type": "application/json" });
                        res.end(JSON.stringify(rest_api_format_1.default.status401({}, "Email already used")));
                    }
                });
            }));
        });
    }
    static signUpResponse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            req.on("data", (chunk) => __awaiter(this, void 0, void 0, function* () {
                const requestBody = json_parse_1.default.JSONtoObject(chunk);
                const { email, password, username, phone } = JSON.parse(requestBody);
                const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
                const userId = (0, uuid_1.v4)();
                const userBalance = 0;
                const create_at = new Date();
                const update_at = new Date();
                const token = auth_access_token_1.default.createAccessToken({
                    userId,
                    email,
                });
                connection
                    .insert(`INSERT INTO user (user_id, email, username, hp, password, cookies, create_at, update_at, saldo, playtime, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
                    "/",
                ])
                    .then((_) => {
                    const fileName = `${userId.replace(/-/gi, "")}`;
                    try {
                        fs_1.default.mkdir(path_1.default.join(__dirname, `..\\assets\\images\\${userId.replace(/-/gi, "")}`), (err) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                        fs_1.default.copyFile(path_1.default.join(__dirname, `..\\assets\\images\\avatar-profile-100.jpg`), path_1.default.join(__dirname, `..\\assets\\images\\${fileName}\\${fileName}-profile.jpg`), (err) => {
                            if (err)
                                throw err;
                        });
                        connection.update(`UPDATE user SET img=? WHERE user_id=?`, [
                            `${fileName}-profile.jpg`,
                            userId,
                        ]);
                    }
                    catch (error) { }
                    const result = JSON.stringify(rest_api_format_1.default.status201({
                        userId,
                        email,
                        username,
                        phone,
                        images: `${fileName}-profile.jpg`,
                        token,
                        create_at,
                        update_at,
                    }, "Sign up success"));
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(result);
                })
                    .catch((err) => {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    if (err.errno == 1062) {
                        res.end(JSON.stringify(rest_api_format_1.default.status400(err, "Email already exist")));
                    }
                    else {
                        res.end(JSON.stringify({ error: err }));
                    }
                });
            }));
        });
    }
    static signOutResponse(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const token = JSON.parse((_a = auth_access_token_1.default.checkAccessToken(req.headers.authorization)) !== null && _a !== void 0 ? _a : "");
            let userData;
            yield connection
                .select(`SELECT * FROM user WHERE user_id=?`, [token.userId])
                .then((chunk) => {
                userData = chunk;
            });
            if (req.headers.authorization == userData.cookies) {
                connection.update(`UPDATE user SET cookies=? WHERE user_id=?`, [
                    "",
                    token.userId,
                ]);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(rest_api_format_1.default.status200({}, "Sign out success")));
            }
            else {
                res.writeHead(401, { "Content-Type": "application/json" });
                res.end(JSON.stringify(rest_api_format_1.default.status401({}, "Unauthorized")));
            }
        });
    }
}
exports.default = AuthRoute;
