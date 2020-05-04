const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { protectRoute } = require("../middleware/auth");
const {
  createOne,
  findOne,
  setToken,
  setCookie,
  respondLoggedIn,
  logout,
} = require("../controllers/user.controller");

router.post("/register", createOne);

router.post("/logout", logout);

router.post("/login", wrapAsync(setToken), setCookie, respondLoggedIn);

router.get("/:username", protectRoute, findOne);

module.exports = router;
