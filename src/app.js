import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express()

// using cross origin resource shearing 
// this help the check if the origin that is making request is autherized or not
app.use(cors({
    origin: process.env.FRONTEND_URL,
    Credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from "../src/user.routes.js"

app.use("/api/v1/users", userRouter)



export default app;