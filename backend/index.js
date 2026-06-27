import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import app from "./app.js";

dotenv.config({
    path:"./.env"
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000 , () => {
        console.log("SERVER RUNNING AT PORT 8000");
    })
})
.catch((err)=>{
    console.log("mongodb connection failed" , err);
})
