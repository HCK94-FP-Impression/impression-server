const router = require("express").Router();
const CommunityController = require("../controllers/communityController");
const authentication = require("../middlewares/authentication");

router.get("/", authentication, CommunityController.getCommunities);
router.get("/:id", authentication, CommunityController.getCommunityById);
router.post("/:id/join", authentication, CommunityController.joinCommunity);
router.patch(
  "/:id/members/:userId/approve",
  authentication,
  CommunityController.approveMember,
);
router.patch(
  "/:id/members/:userId/reject",
  authentication,
  CommunityController.rejectMember,
);
router.get(
  "/:id/dashboard",
  authentication,
  CommunityController.getCommunityDashboard,
);
router.get("/:id/posts", authentication, CommunityController.getCommunityPosts);
router.post(
  "/:id/posts",
  authentication,
  CommunityController.createCommunityPost,
);

module.exports = router;
