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
const saltRounds = 10;
const connection = sql_connection_1.default.getInstance();
connection.getConnection();
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
                    .then((chunk) => {
                    const verifyPassword = bcrypt_1.default.compareSync(password, chunk.password);
                    const token = auth_access_token_1.default.createAccessToken({
                        email: chunk.email,
                        username: chunk.username,
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
                            address: chunk.id_address,
                            image: chunk.img,
                            token: token,
                            ballance: chunk.saldo,
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
                });
            });
        });
    }
    static signUpResponse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            req.on("data", (chunk) => __awaiter(this, void 0, void 0, function* () {
                const requestBody = json_parse_1.default.JSONtoObject(chunk);
                const { email, password, username, phone } = JSON.parse(requestBody);
                const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
                const token = auth_access_token_1.default.createAccessToken({ email, username });
                const userId = (0, uuid_1.v4)();
                const addressId = "";
                const userBalance = 0;
                const create_at = new Date().toISOString();
                const update_at = new Date().toISOString();
                connection
                    .insert(`INSERT INTO user (user_id, email, password, username, hp, create_at, update_at, cookies, id_alamat, saldo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    userId,
                    email,
                    hashedPassword,
                    username,
                    phone,
                    create_at,
                    update_at,
                    token,
                    addressId,
                    userBalance,
                ])
                    .catch((err) => {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    if (err.errno == 1062) {
                        res.end(JSON.stringify(rest_api_format_1.default.status400(err, "Email already exist")));
                    }
                    else {
                        res.end(JSON.stringify({ error: err }));
                    }
                })
                    .then((chunk) => {
                    const fileName = `${email}`.substring(0, `${email}`.indexOf("@"));
                    fs_1.default.mkdirSync(path_1.default.join(__dirname, `..\\assets\\images\\${email}`));
                    fs_1.default.copyFile(path_1.default.join(__dirname, `..\\assets\\images\\avatar-profile-100.jpg`), path_1.default.join(__dirname, `..\\assets\\images\\${email}\\${fileName}-profile.jpg`), (err) => {
                        if (err)
                            throw err;
                    });
                    connection.update(`UPDATE user SET img=? WHERE email=?`, [
                        `${fileName}-profile.jpg`,
                        email,
                    ]);
                    const result = JSON.stringify(rest_api_format_1.default.status201({
                        userId,
                        email,
                        hashedPassword,
                        username,
                        phone,
                        images: `${fileName}-profile.jpg`,
                        create_at,
                        update_at,
                        token,
                        addressId,
                    }, "Sign up success"));
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(result);
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
