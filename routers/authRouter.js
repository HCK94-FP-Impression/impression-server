const router = require("express").Router();
const AuthController = require("../controllers/authController");
const authentication = require("../middlewares/authentication");

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.get("/me", authentication, AuthController.me);

module.exports = router;
