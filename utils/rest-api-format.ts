class RestAPIFormat {
  static status200(data: any, message: string = "Success") {
    return {
      status: "Success",
      statusCode: 200,
      message: message,
      data: data,
    };
  }

  static status201(data: any, message: string = "Created") {
    return {
      status: "Created",
      statusCode: 201,
      message: message,
      data: data,
    };
  }

  static status202(data: any, message: string = "Accepted") {
    return {
      status: "Accepted",
      statusCode: 202,
      message: message,
      data: data,
    };
  }

  static status400(data: any, message: string = "Bad Request") {
    return {
      status: "Bad Request",
      statusCode: 400,
      message: message,
      data: data,
    };
  }

  static status401(data: any, message: string = "Unauthorized") {
    return {
      status: "Unauthorized",
      statusCode: 401,
      message: message,
      data: data,
    };
  }

  static status403(data: any, message: string = "Forbidden") {
    return {
      status: "Forbidden",
      statusCode: 403,
      message: message,
      data: data,
    };
  }

  static status404(data: any, message: string = "Not Found") {
    return {
      status: "Not Found",
      statusCode: 404,
      message: message,
      data: data,
    };
  }

  static status500(data: any, message: string = "Internal Server Error") {
    return {
      status: "Internal Server Error",
      statusCode: 500,
      message: message,
      data: data,
    };
  }

  static status501(data: any, message: string = "Not Implemented") {
    return {
      status: "Not Implemented",
      statusCode: 501,
      message: message,
      data: data,
    };
  }

  static status503(data: any, message: string = "Service Unavailable") {
    return {
      status: "Service Unavailable",
      statusCode: 503,
      message: message,
      data: data,
    };
  }
}

export default RestAPIFormat;
