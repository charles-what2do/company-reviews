const express = require("express");
const Company = require("../models/company.model");
const { v4: uuid } = require("uuid");
const wrapAsync = require("../utils/wrapAsync");

const findAll = wrapAsync(async (req, res, next) => {
  const foundCompanies = await Company.find(null, "-_id -__v -reviews");
  res.status(200).send(foundCompanies);
});

const findOne = wrapAsync(async (req, res, next) => {
  const foundCompany = await Company.findOne(
    { id: req.params.id },
    "-_id -__v"
  );
  if (!!foundCompany) {
    res.status(200).send(foundCompany);
  } else {
    const error = new Error("Company not found");
    error.statusCode = 404;
    next(error);
  }
});

const postReview = wrapAsync(async (req, res, next) => {
  const foundCompany = await Company.findOne({ id: req.params.id });
  if (!foundCompany) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    next(error);
  } else {
    foundCompany.reviews.push({
      id: uuid(),
      userId: req.user.userid,
      username: req.user.username,
      rating: req.body.rating,
      title: req.body.title,
      review: req.body.review,
    });
    const updatedCompany = await foundCompany.save();
    res
      .status(201)
      .send(updatedCompany.reviews[updatedCompany.reviews.length - 1]);
  }
});

module.exports = {
  findOne,
  findAll,
  postReview,
};
