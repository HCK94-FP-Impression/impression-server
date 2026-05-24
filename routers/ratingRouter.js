const router = require("express").Router();
const RatingController = require("../controllers/ratingController");
const authentication = require("../middlewares/authentication");

router.post("/", authentication, RatingController.createRating);

module.exports = router;
