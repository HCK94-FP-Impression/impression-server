const { comparePassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { User } = require("../models");

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) throw { name: "BadRequest", message: "Email is required" };
      if (!password)
        throw { name: "BadRequest", message: "Password is required" };

      const user = await User.findOne({ where: { email } });
      if (!user)
        throw { name: "Unauthorized", message: "Invalid email or password" };

      const isPasswordValid = comparePassword(password, user.password);
      if (!isPasswordValid)
        throw { name: "Unauthorized", message: "Invalid email or password" };

      const payload = {
        id: user.id,
        email: user.email,
      };

      const token = signToken(payload);
      res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });

      res.status(200).json({ message: "Login successful" });
    } catch (err) {
      next(err);
    }
  }

  static async register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      const newUser = await User.create({ username, email, password });

      res
        .status(201)
        .json({ message: "User registered successfully", userId: newUser.id });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ["password", "createdAt", "updatedAt"] },
      });

      if (!user) throw { name: "NotFound", message: "User not found" };

      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
