import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import UserRoute from "./src/routes/UserRoute.js"
import ProfileRoute from "./src/routes/ProfileRoute.js";
import GameProfileRoute from "./src/routes/GameProfileRoute.js";
import DiscoveryRoute from "./src/routes/DiscoveryRoute.js";
import PlayerRequestRoute from "./src/routes/PlayerRequestRoute.js";
import FriendRoute from "./src/routes/FriendRoute.js";
import TeamRoute from "./src/routes/TeamRoute.js";

const app = express()

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/user",UserRoute);
app.use("/api/v1/profile",ProfileRoute);
app.use("/api/v1/game-profile",GameProfileRoute);
app.use("/api/v1/discovery",DiscoveryRoute);
app.use("/api/v1/player-request",PlayerRequestRoute);
app.use("/api/v1/friend",FriendRoute);
app.use("/api/v1/team",TeamRoute);
export default app;
