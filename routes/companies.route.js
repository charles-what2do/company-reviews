const express = require("express");
const router = express.Router();
const { protectRoute } = require("../middleware/auth");
const {
  findOne,
  findAll,
  postReview,
} = require("../controllers/companies.controller");

router.get("/", findAll);

router.get("/:id", findOne);

router.post("/:id/reviews", protectRoute, postReview);

module.exports = router;
