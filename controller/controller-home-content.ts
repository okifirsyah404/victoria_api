import http from "http";

import SQLConnection from "../config/sql-connection";
import AuthAccessToken from "../utils/auth-access-token";
import RestAPIFormat from "../utils/rest-api-format";


const connection = SQLConnection.getInstance();
connection.getConnection();

class homeRoute {
    public static async getHomeContent(
        req: http.IncomingMessage,
        res: http.ServerResponse
    ) { 
        const token = JSON.parse(
        AuthAccessToken.checkAccessToken(req.headers.authorization) ?? ""
        );
    
        let userData: any;
    
        await connection
        .select(`SELECT * FROM user WHERE email=?`, [token.email])
        .then((chunk) => {
            userData = chunk;
        });
    
        if (userData) {
        res.writeHead(200);
        res.end(
            JSON.stringify(
            RestAPIFormat.status200({
                userId: userData.user_id,
                email: userData.email,
                username: userData.username,
                phone: userData.hp,
                address: userData.id_address,
                image: userData.img,
                token: userData.cookies,
            })
            )
        );
        } else {
        res.writeHead(404);
        res.end(JSON.stringify(RestAPIFormat.status404("User not found")));
        }
    }


}