import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import UserRoute from "./src/routes/UserRoute.js"
import ProfileRoute from "./src/routes/ProfileRoute.js";

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
export default app;
