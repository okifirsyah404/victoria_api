"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ParseJSON {
    constructor() { }
    static parseJSON(body) {
        return JSON.parse(body);
    }
    static parseJSONAsync(body) {
        return new Promise((resolve, reject) => {
            try {
                resolve(JSON.parse(body));
            }
            catch (error) {
                reject(error);
            }
        });
    }
    static StringifyJSON(body) {
        return JSON.stringify(body);
    }
    static JSONtoObject(chunk) {
        let body = [];
        body.push(chunk);
        return Buffer.concat(body).toString();
    }
}
exports.default = ParseJSON;
