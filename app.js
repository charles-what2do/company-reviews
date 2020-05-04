const express = require("express");
const cookierParser = require("cookie-parser");
const app = express();
require("./utils/db");

app.use(express.json());
app.use(cookierParser(process.env.COOKIE_SECRET_KEY));
app.use;

const companiesRouter = require("./routes/companies.route");
const userRouter = require("./routes/user.route");
app.use("/companies", companiesRouter);
app.use("/user", userRouter);

app.get("/", (req, res) => {
  res.json({
    "0": "GET /",
    "1": "GET /companies",
    "2": "GET /companies/:id",
    "3": "POST /companies/:id/reviews",
    "4": "GET /user",
    "5": "POST /user/register",
    "6": "POST /user/login",
    "7": "POST /user/logout",
  });
});

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500);
  const message = err.message || "Internal server error";
  if (app.get("env") === "development" || app.get("env") === "test") {
    console.log(err);
  }
  res.send({ error: `${message}` });
});

module.exports = app;
