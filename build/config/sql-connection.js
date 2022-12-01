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
const mysql2_1 = __importDefault(require("mysql2"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class SQLConnection {
    constructor() {
        this.connection = mysql2_1.default.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "test",
        });
    }
    static getInstance() {
        if (!SQLConnection.instance) {
            SQLConnection.instance = new SQLConnection();
        }
        return SQLConnection.instance;
    }
    getConnection() {
        return this.connection;
    }
    manualQuery(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }
    select(sql, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.manualQuery(sql, args);
            return rows[0];
        });
    }
    selectAll(sql, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.manualQuery(sql, args);
            return rows;
        });
    }
    insert(sql, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.manualQuery(sql, args);
            return rows.insertId;
        });
    }
    update(sql, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.manualQuery(sql, args);
            return rows.affectedRows;
        });
    }
    delete(sql, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.manualQuery(sql, args);
            return rows.affectedRows;
        });
    }
    closeConnection() {
        this.connection.end();
    }
}
exports.default = SQLConnection;
