import express from "express";
import User from "../database/models/user.model.js";
import { Register, Login, Logout } from "../controllers/user.controller.js";
import { getUserByCookies } from "../middleware/getUser.js";

const routers = express.Router();

routers.route("/register").post(Register);
routers.route("/login").post(Login);
routers.route("/logout").post(getUserByCookies, Logout);

export default routers;