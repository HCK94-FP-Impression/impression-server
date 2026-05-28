const { verifyToken } = require("../helpers/jwt");
const { User } = require("../models");

const authentication = async (req, res, next) => {
  try {
    const { access_token } = req.cookies;
    if (!access_token) {
      throw { name: "Unauthorized", message: "Invalid Token" };
    }

    const payload = verifyToken(access_token);
    const user = await User.findByPk(payload.id);
    if (!user) {
      throw { name: "Unauthorized", message: "Invalid Token" };
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authentication;
