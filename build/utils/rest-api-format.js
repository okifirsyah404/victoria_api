"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RestAPIFormat {
    static status200(data, message = "Success") {
        return {
            status: "Success",
            statusCode: 200,
            message: message,
            data: data,
        };
    }
    static status201(data, message = "Created") {
        return {
            status: "Created",
            statusCode: 201,
            message: message,
            data: data,
        };
    }
    static status202(data, message = "Accepted") {
        return {
            status: "Accepted",
            statusCode: 202,
            message: message,
            data: data,
        };
    }
    static status400(data, message = "Bad Request") {
        return {
            status: "Bad Request",
            statusCode: 400,
            message: message,
            data: data,
        };
    }
    static status401(data, message = "Unauthorized") {
        return {
            status: "Unauthorized",
            statusCode: 401,
            message: message,
            data: data,
        };
    }
    static status403(data, message = "Forbidden") {
        return {
            status: "Forbidden",
            statusCode: 403,
            message: message,
            data: data,
        };
    }
    static status404(data, message = "Not Found") {
        return {
            status: "Not Found",
            statusCode: 404,
            message: message,
            data: data,
        };
    }
    static status500(data, message = "Internal Server Error") {
        return {
            status: "Internal Server Error",
            statusCode: 500,
            message: message,
            data: data,
        };
    }
    static status501(data, message = "Not Implemented") {
        return {
            status: "Not Implemented",
            statusCode: 501,
            message: message,
            data: data,
        };
    }
    static status503(data, message = "Service Unavailable") {
        return {
            status: "Service Unavailable",
            statusCode: 503,
            message: message,
            data: data,
        };
    }
}
exports.default = RestAPIFormat;
