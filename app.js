if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const router = require("./routers");

const app = express();

app.use(cors({
  origin: true, 
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(router);

const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

module.exports = app;
