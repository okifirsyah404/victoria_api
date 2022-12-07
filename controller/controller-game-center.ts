import http from "http";

class gamecenterRoute {
    public static gamecenterRoute (
        req: http.IncomingMessage,
        res: http.ServerResponse
    )

    {
        res.end("gamecenter");
    }
}