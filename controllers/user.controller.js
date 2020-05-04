const express = require("express");
const User = require("../models/user.model");
const { v4: uuid } = require("uuid");
const wrapAsync = require("../utils/wrapAsync");
const bcrypt = require("bcryptjs");
const { createJWTToken } = require("../utils/jwt");

const createOne = wrapAsync(async (req, res, next) => {
  const submittedUser = req.body;
  const user = new User(submittedUser);
  user.id = uuid();
  const newUser = await user.save();
  res.send(newUser);
});

const findOne = wrapAsync(async (req, res, next) => {
  const usernameToFind = req.params.username;
  const user = await User.findOne({ username: usernameToFind });
  if (!user) {
    const noUserError = new Error("No such user");
    noUserError.statusCode = 404;
    throw noUserError;
  }
  if (req.user.username != usernameToFind) {
    const userNotAllowedError = new Error("Forbidden");
    userNotAllowedError.statusCode = 403;
    throw userNotAllowedError;
  }

  const userObject = user.toObject();
  const { _id, __v, password, ...strippedUser } = userObject;
  res.json(strippedUser);
});

const respondLoggedIn = (req, res) => {
  res.send("You are logged in");
};

const setToken = async (req, res, next) => {
  const loginDetails = req.body;
  const { username, password } = loginDetails;
  const foundUser = await User.findOne({ username: username });

  if (!foundUser) {
    const noUserError = new Error("No such user");
    noUserError.statusCode = 404;
    throw noUserError;
  }

  const result = await bcrypt.compare(password, foundUser.password);
  if (!result) {
    const wrongPasswordError = new Error("Wrong password");
    wrongPasswordError.statusCode = 400;
    throw wrongPasswordError;
  }

  req.token = createJWTToken(foundUser.id, username);
  next();
};

const setCookie = (req, res, next) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = oneDay * 7;
  const expiryDate = new Date(Date.now() + oneWeek);

  const cookieName = "token";
  const token = req.token;

  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
    res.cookie(cookieName, token, {
      expires: expiryDate,
      httpOnly: true,
      signed: true,
    });
  } else {
    res.cookie(cookieName, token, {
      expires: expiryDate,
      httpOnly: true, // client-side js cannot access cookie info
      secure: true, //use HTTPS
      signed: true,
    });
  }
  next();
};

const logout = (req, res) => {
  res.clearCookie("token").send("You have been logged out");
};

module.exports = {
  createOne,
  findOne,
  setToken,
  setCookie,
  respondLoggedIn,
  logout,
};
