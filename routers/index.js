const router = require("express").Router();
const authRouter = require("./authRouter");
const ratingRouter = require("./ratingRouter");
const postRouter = require("./postRouter");
const cvRouter = require("./cvRouter");

router.get("/", (req, res) => {
  res.send("Welcome to Impression API");
});

router.use("/auth", authRouter);
router.use("/ratings", ratingRouter);
router.use("/posts", postRouter);
router.use("/cvs", cvRouter)

module.exports = router;
