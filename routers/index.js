const router = require("express").Router();
const authRouter = require("./authRouter");
const ratingRouter = require("./ratingRouter");
const postRouter = require("./postRouter");
const cvRouter = require("./cvRouter");
const jobRouter = require("./jobRouter");
const communityRouter = require("./communityRouter");

router.get("/", (req, res) => {
  res.send("Welcome to Impression API");
});

router.use("/auth", authRouter);
router.use("/ratings", ratingRouter);
router.use("/posts", postRouter);
router.use("/communities", communityRouter);
router.use("/cvs", cvRouter)
router.use("/jobs", jobRouter)

module.exports = router;
