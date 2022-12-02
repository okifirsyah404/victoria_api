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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sql_connection_1 = __importDefault(require("../config/sql-connection"));
const rest_api_format_1 = __importDefault(require("../utils/rest-api-format"));
const auth_access_token_1 = __importDefault(require("../utils/auth-access-token"));
const formidable_1 = __importDefault(require("formidable"));
const connection = sql_connection_1.default.getInstance();
connection.getConnection();
class ImagesRoute {
    constructor() { }
    static getImage(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const token = JSON.parse((_a = auth_access_token_1.default.checkAccessToken(req.headers.authorization)) !== null && _a !== void 0 ? _a : "");
            let userData;
            yield connection
                .select(`SELECT * FROM user WHERE email=?`, [token.email])
                .then((chunk) => {
                userData = chunk;
            });
            const filePath = path_1.default.join(__dirname, `..\\assets\\images\\${token.email}\\${userData.img}`);
            fs_1.default.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end(JSON.stringify(rest_api_format_1.default.status404(err)));
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": "image/jpeg",
                    "Content-Length": data.length,
                });
                res.end(data);
            });
        });
    }
    static uploadImage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const form = new formidable_1.default.IncomingForm({});
            form.parse(req, (err, fields, files) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const token = JSON.parse((_a = auth_access_token_1.default.checkAccessToken(req.headers.authorization)) !== null && _a !== void 0 ? _a : "");
                let userData;
                yield connection
                    .select(`SELECT * FROM user WHERE email=?`, [token.email])
                    .then((chunk) => {
                    userData = chunk;
                });
                const oldPath = files.file.filepath;
                const newPath = path_1.default.join(__dirname, `..\\assets\\images\\${token.email}\\${userData.img}`);
                fs_1.default.copyFile(oldPath, newPath, (err) => {
                    if (err)
                        throw err;
                });
                const result = JSON.stringify(rest_api_format_1.default.status201({
                    userId: userData.userId,
                    email: userData.email,
                    hashedPassword: userData.hashedPassword,
                    username: userData.username,
                    phone: userData.phone,
                    images: userData.img,
                    create_at: userData.create_at,
                    update_at: userData.update_at,
                    token: userData.cookies,
                    addressId: userData.addressId,
                }, "Upload image success"));
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(result);
            }));
        });
    }
}
exports.default = ImagesRoute;
