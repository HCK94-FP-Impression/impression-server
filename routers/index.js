const router = require("express").Router();

router.get("/", (req, res) => {
  res.send("Welcome to Impression API");
});

module.exports = router;
