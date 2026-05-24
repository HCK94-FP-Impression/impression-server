const router = require("express").Router();
const authRouter = require("./authRouter");
const ratingRouter = require("./ratingRouter");

router.get("/", (req, res) => {
  res.send("Welcome to Impression API");
});

router.use("/auth", authRouter);
router.use("/ratings", ratingRouter);

module.exports = router;
