import http from "http";
import bcrypt from "bcrypt";
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

    public static async UpdatehomeContent(
        req: http.IncomingMessage,
        res: http.ServerResponse
    ) {
        let requestBody: string;

        req.on("data", async (chunk) => {
        requestBody = chunk;
        });

        req.on("end", () => {
        const { email, password } = JSON.parse(requestBody);
        connection
            .select(`SELECT * FROM user WHERE email=? `, [email])
            .catch((err) => {
            console.log(err);
            })
            .then((chunk) => {
            const verifyPassword = bcrypt.compareSync(password, chunk.password);

            const token = AuthAccessToken.createAccessToken({
                email: chunk.email,
                username: chunk.username,
            });

            connection.update(`UPDATE user SET cookies=? WHERE email=?`, [
                token,
                chunk.email,
            ]);

            if (verifyPassword) {
                const result = JSON.stringify(
                RestAPIFormat.status200(
                    {
                    userId: chunk.user_id,
                    email: chunk.email,
                    username: chunk.username,
                    phone: chunk.hp,
                    address: chunk.id_address,
                    image: chunk.img,
                    token: token,
                    balance: chunk.saldo,
                    create_at: chunk.create_at,
                    update_at: chunk.update_at,
                    },
                    "Login success"
                )
                );
                res.writeHead(200);
                res.end(result);
            } else {
                res.writeHead(401);
                res.end(
                JSON.stringify(
                    RestAPIFormat.status401("Password not match")
                )
                );
            }
            });
        });
    }


}