const { Post, Rating, User } = require("../models");

class RatingController {
  /**
   * POST /ratings
   * Submit rating untuk sebuah post.
   *
   * Request body:
   * - postId  : integer — ID post yang ingin dinilai
   * - scores  : integer[] — array nilai per criteria (0-3), panjang harus sama dengan post.criteria
   * - insight : string (opsional) — komentar, hanya berlaku untuk ratingType professional
   *
   * ratingType di-detect otomatis:
   * - "professional_recruiter" → voter adalah recruiter
   * - "professional_same_job" → voter adalah job_seeker dengan targetJob sama dengan post
   * - "social" → selain dua kondisi di atas
   *
   * Jika voter sudah pernah menilai post yang sama, rating lama akan diperbarui (bukan dibuat baru).
   * Quota voter bertambah +1 hanya saat rating pertama kali dibuat.
   */
  static async createRating(req, res, next) {
    try {
      // Ambil data dari request body
      const { postId, scores, insight } = req.body;
      if (!postId) {
        throw { name: "BadRequest", message: "Post ID is required" };
      }

      // Cari post yang ingin dinilai
      const post = await Post.findByPk(postId);
      if (!post) {
        throw { name: "NotFound", message: "Post not found" };
      }

      // Validasi scores harus array
      if (!Array.isArray(scores)) {
        throw { name: "BadRequest", message: "Scores must be an array" };
      }

      // Validasi setiap score harus integer antara 0-3
      const isInvalidScore = scores.some(
        (score) => !Number.isInteger(score) || score < 0 || score > 3,
      );
      if (isInvalidScore) {
        throw {
          name: "BadRequest",
          message: "Each score must be an integer between 0 and 3",
        };
      }

      // Validasi panjang scores harus sama dengan jumlah criteria post
      if (scores.length !== post.criteria.length) {
        throw {
          name: "BadRequest",
          message: "Scores length must match criteria length",
        };
      }

      // User tidak boleh menilai post miliknya sendiri
      if (post.userId === req.user.id) {
        throw {
          name: "Forbidden",
          message: "You cannot rate your own post",
        };
      }

      // Auto-detect ratingType berdasarkan role dan targetJob voter
      let ratingType = "social";
      if (req.user.role === "recruiter") {
        ratingType = "professional_recruiter";
      } else {
        // Cek apakah voter punya post dengan targetJob yang sama
        const voterPost = await Post.findOne({
          where: { userId: req.user.id },
        });
        if (voterPost && voterPost.targetJob === post.targetJob) {
          ratingType = "professional_same_job";
        }
      }

      // Insight hanya berlaku untuk ratingType professional, diabaikan untuk social
      const finalInsight = ratingType === "social" ? null : insight || null;

      // Cek apakah voter sudah pernah menilai post ini sebelumnya
      const existingRating = await Rating.findOne({
        where: { postId, voterId: req.user.id },
      });

      if (existingRating) {
        // Update rating yang sudah ada
        await existingRating.update({
          scores,
          insight: finalInsight,
          ratingType,
        });
        res.status(200).json({ message: "Rating updated successfully" });
      } else {
        // Buat rating baru dan tambah quota voter +1
        await Rating.create({
          postId,
          voterId: req.user.id,
          scores,
          ratingType,
          insight: finalInsight,
        });
        await User.increment("quota", { where: { id: req.user.id }, by: 1 });
        res.status(201).json({ message: "Rating created successfully" });
      }
    } catch (err) {
      next(err);
    }
  }
}

module.exports = RatingController;
