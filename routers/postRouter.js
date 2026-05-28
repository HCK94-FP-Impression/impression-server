const router = require("express").Router();
const PostController = require("../controllers/postController");
const upload = require("../helpers/multer");
const authentication = require("../middlewares/authentication");

router.get("/feed", authentication, PostController.getFeed);
router.get("/my-post", authentication, PostController.getMyPost);
router.post(
  "/",
  authentication,
  upload.single("image"),
  PostController.createPost,
);
router.put(
  "/",
  authentication,
  upload.single("image"),
  PostController.updateMyPost,
);
router.post(
  "/generate-criteria",
  authentication,
  PostController.generateCriteria,
);
router.post(
  "/analyze",
  authentication,
  PostController.analyzePost,
);

module.exports = router;
