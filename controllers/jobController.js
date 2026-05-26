const axios = require("axios");
const { Post } = require('../models')
const { validateJobCategory } = require("../helpers/gemini");

class JobController {
  static async getRecommendations(req, res, next) {
    try {
      const { id: userId } = req.user
      const post = await Post.findOne({where: {userId}})
      const keywords = post?.targetJob
      const location = "Indonesia"

      if (!post) throw {name: 'BadRequest', message: 'Post is required'}

      if (!keywords) {
        throw { name: "BadRequest", message: "Target Job is required" };
      }

      const apiKey = process.env.JOOBLE_API_KEY;
      const apiUrl = String(
        process.env.JOOBLE_API_URL || "https://jooble.org/api",
      )
        .trim()
        .replace(/\/+$/, "");

      if (!apiKey) {
        throw { name: "BadRequest", message: "JOOBLE_API_KEY is required" };
      }

      const { data } = await axios.post(
        `${apiUrl}/${apiKey}`,
        {
          keywords,
          location: location,
        },
        {
          timeout: 15000,
        },
      );

      return res.status(200).json(data);
    } catch (err) {
      if (err.isAxiosError) {
        return next({
          name: "UpstreamError",
          message:
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to fetch data from Jooble API",
        });
      }

      return next(err);
    }
  }
}

module.exports = JobController;
