const { Post, Cv } = require("../models");

const authorizePost = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { id: postId } = req.params;

    const post = await Post.findByPk(postId);
    if (!post) {
      throw { name: "NotFound", message: "Post not found" };
    }

    if (post.userId !== id) {
      throw {
        name: "Forbidden",
        message: "You are not authorized to access this post",
      };
    }

    next();
  } catch (err) {
    next(err);
  }
};

const authorizeCv = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { id: cvId } = req.params;

    const cv = await Cv.findByPk(cvId);
    if (!cv) {
      throw { name: "NotFound", message: "CV not found" };
    }

    if (cv.userId !== id) {
      throw {
        name: "Forbidden",
        message: "You are not authorized to access this CV",
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authorizePost, authorizeCv };
