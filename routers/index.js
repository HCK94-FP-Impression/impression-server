const router = require("express").Router();
const authRouter = require("./authRouter");
const ratingRouter = require("./ratingRouter");
const postRouter = require("./postRouter");

router.get("/", (req, res) => {
  res.send("Welcome to Impression API");
});

router.use("/auth", authRouter);
router.use("/ratings", ratingRouter);
router.use("/posts", postRouter);

module.exports = router;
