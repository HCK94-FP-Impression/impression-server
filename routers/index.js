const router = require("express").Router();
const authRouter = require("./authRouter");

router.get("/", (req, res) => {
  res.send("Welcome to Impression API");
});

router.use("/auth", authRouter);

module.exports = router;
