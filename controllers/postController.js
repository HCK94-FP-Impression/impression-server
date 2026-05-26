const { Post, User, Rating, Cv } = require("../models");
const cloudinary = require("../helpers/cloudinary");
const {
  generateCriteria: generateCriteriaGemini,
  analyzeProfile,
} = require("../helpers/gemini");
const { Op } = require("sequelize");
const { buildCriteriaBreakdown } = require("../helpers/ratingHelper");

class PostController {
  /**
   * POST /posts/generate-criteria
   * Generate kriteria penilaian berdasarkan target job menggunakan Gemini AI.
   *
   * Request body:
   * - targetJob : string — profesi yang dituju user (misal: "Backend Developer")
   *
   * Response:
   * - criteria : string[] — array 3 adjektif yang relevan dengan profesi tersebut
   *
   * Dipanggil di frontend saat user memilih targetJob dari dropdown,
   * sebelum user submit createPost. Hasil criteria dikirim kembali sebagai
   * bagian dari body createPost.
   */
  static async generateCriteria(req, res, next) {
    try {
      const { targetJob } = req.body;
      if (!targetJob) {
        throw { name: "BadRequest", message: "Target Job is required" };
      }

      const criteria = await generateCriteriaGemini(targetJob);
      res.status(200).json({ criteria });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /posts
   * Membuat profil post baru untuk user yang sedang login.
   *
   * Syarat:
   * - User harus memiliki quota >= 5 (akan dikurangi -5 setelah berhasil)
   * - User belum pernah membuat post sebelumnya (1 user 1 post)
   * - Foto wajib diupload (multipart/form-data)
   *
   * Request (multipart/form-data):
   * - image     : File — foto profil profesional
   * - targetJob : string — profesi yang dituju
   * - criteria  : string — JSON string array criteria (dari generateCriteria)
   *
   * Response:
   * - post : object — data post yang baru dibuat
   *
   * aiScore dan aiInsight akan bernilai null sampai user mengisi CV.
   * Setelah CV diisi, Aaron di cvController akan trigger analyzeProfile
   * untuk mengisi aiScore dan aiInsight.
   */
  static async createPost(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id);
      if (user.quota < 5) {
        throw {
          name: "BadRequest",
          message: "Insufficient quota",
        };
      }

      const post = await Post.findOne({ where: { userId: req.user.id } });
      if (post) {
        throw {
          name: "BadRequest",
          message: "You have already created a post",
        };
      }

      if (!req.file) throw { name: "BadRequest", message: "Image is required" };
      const base64Img = req.file.buffer.toString("base64");
      const base64DataUrl = `data:${req.file.mimetype};base64,${base64Img}`;

      const cloudinaryResult = await cloudinary.uploader.upload(base64DataUrl);

      const { targetJob, criteria } = req.body;
      const newPost = await Post.create({
        userId: req.user.id,
        image: cloudinaryResult.secure_url,
        targetJob,
        criteria: JSON.parse(criteria),
      });

      await user.decrement("quota", { by: 5 });
      res.status(201).json({ post: newPost });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /posts/my-post
   * Mengambil detail post milik user yang sedang login beserta statistik rating.
   *
   * Response:
   * - post              : object — data post milik user
   * - criteriaBreakdown : object — statistik rata-rata per criteria, dipisah per segmen:
   *     - social        : rata-rata dari social ratings
   *     - professional  : rata-rata dari professional_recruiter + professional_same_job
   *
   * Digunakan untuk halaman dashboard/profil user sendiri.
   */
  static async getMyPost(req, res, next) {
    try {
      const userId = req.user.id;
      const post = await Post.findOne({
        where: {
          userId,
        },
      });

      if (!post) {
        throw { name: "NotFound", message: "Post not found" };
      }

      const ratings = await Rating.findAll({
        where: { postId: post.id },
      });

      const criteriaBreakdown = buildCriteriaBreakdown(post.criteria, ratings);

      res.status(200).json({ post, criteriaBreakdown });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /posts
   * Mengupdate post milik user yang sedang login.
   *
   * Syarat:
   * - User harus memiliki quota >= 5 (akan dikurangi -5 setelah berhasil)
   * - Semua field bersifat opsional — hanya field yang dikirim yang diupdate
   *
   * Request (multipart/form-data):
   * - image     : File (opsional) — foto profil baru
   * - targetJob : string (opsional) — profesi baru
   * - criteria  : string (opsional) — JSON string array criteria baru
   *
   * Perhatian:
   * - Jika targetJob atau criteria berubah, SEMUA ratings akan dihapus otomatis
   * - Frontend harus menampilkan warning sebelum user submit perubahan criteria/targetJob
   * - aiScore dan aiInsight TIDAK di-reset saat update post
   *
   * Response:
   * - post : object — data post yang sudah diupdate
   */
  static async updateMyPost(req, res, next) {
    try {
      const userId = req.user.id;
      const post = await Post.findOne({
        where: {
          userId,
        },
      });

      if (!post) {
        throw { name: "NotFound", message: "Post not found" };
      }

      const user = await User.findByPk(req.user.id);
      if (user.quota < 5) {
        throw {
          name: "BadRequest",
          message: "Insufficient quota",
        };
      }

      if (req.file) {
        const base64Img = req.file.buffer.toString("base64");
        const base64DataUrl = `data:${req.file.mimetype};base64,${base64Img}`;
        const cloudinaryResult =
          await cloudinary.uploader.upload(base64DataUrl);
        post.image = cloudinaryResult.secure_url;
      }

      const { targetJob, criteria } = req.body;

      // Cek apakah ada perubahan di targetJob atau criteria
      // Jika ada, semua ratings dihapus karena index scores tidak relevan lagi
      const hasChanges =
        (targetJob && targetJob !== post.targetJob) ||
        (criteria &&
          JSON.stringify(JSON.parse(criteria)) !==
            JSON.stringify(post.criteria));

      if (hasChanges) {
        await Rating.destroy({ where: { postId: post.id } });
      }

      if (targetJob) post.targetJob = targetJob;
      if (criteria) post.criteria = JSON.parse(criteria);

      await post.save();
      await user.decrement("quota", { by: 5 });
      res.status(200).json({ post });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /posts/feed
   * Mengambil satu post secara random untuk dinilai oleh user yang sedang login.
   *
   * Query params:
   * - skipPostId : integer (opsional) — ID post yang ingin di-skip (tidak ditampilkan)
   *
   * Logic:
   * - Post milik user sendiri tidak akan muncul di feed
   * - Prioritaskan post yang belum pernah dinilai oleh user
   * - Jika semua post sudah pernah dinilai (cycleCompleted), tampilkan random dari semua post
   *
   * Response:
   * - post            : object — data post yang dipilih, termasuk:
   *     - user        : { id, username }
   *     - cv          : data CV user (null jika belum diisi)
   * - cycleCompleted  : boolean — true jika semua post sudah pernah dinilai
   *
   * Untuk skip post, frontend kirim skipPostId = id post yang sedang ditampilkan.
   */
  static async getFeed(req, res, next) {
    try {
      const skipPostId = Number(req.query.skipPostId);

      const posts = await Post.findAll({
        where: {
          userId: { [Op.ne]: req.user.id },
          ...(Number.isInteger(skipPostId) && { id: { [Op.ne]: skipPostId } }),
        },
        include: [
          {
            model: User,
            attributes: ["id", "username"],
            include: [
              {
                model: Cv,
                attributes: ["experiences", "educations", "skills"],
                required: false,
              },
            ],
          },
        ],
      });

      const ratedPosts = await Rating.findAll({
        where: {
          voterId: req.user.id,
        },
        attributes: ["postId"],
      });

      const ratedPostIds = ratedPosts.map((post) => post.postId);

      const unratedPosts = posts.filter(
        (post) => !ratedPostIds.includes(post.id),
      );

      let selectedPost;
      let cycleCompleted = false;

      if (unratedPosts.length > 0) {
        selectedPost =
          unratedPosts[Math.floor(Math.random() * unratedPosts.length)];
      } else {
        cycleCompleted = true;
        selectedPost = posts[Math.floor(Math.random() * posts.length)];
      }

      if (!selectedPost) {
        return res
          .status(200)
          .json({ post: null, message: "No posts available" });
      }

      // Restructure response agar user dan cv sejajar dengan data post
      const { User: userdata, ...postData } = selectedPost.get({ plain: true });
      const { Cv: cvData, ...userData } = userdata;

      res.status(200).json({
        post: { ...postData, user: userData, cv: cvData },
        cycleCompleted,
      });
    } catch (err) {
      next(err);
    }
  }
  /*
    POST - /posts/analyze

    * Bikin analisis dari post (profile) user yang sedang login
    * Requirement:
    *  - Punya CV dengan minimal 1 experience, 1 education, dan 1 skill.
    *  - Punya Post yang lengkap
    *  - Belum pernah menganalisis post pribadi sebelumnya
    * Request Body: Empty
    * Response Structure: {
    *   message: String,
    *   aiScore: Number,
    *   aiInsight: String
    * }

  */
  static async analyzePost(req, res, next) {
        try {
            const {id: userId} = req.user
            
            const cv = await Cv.findOne({where: {userId}})
            if (!cv || cv.educations.length < 2 || cv.experiences.length < 2 || cv.skills.length < 2) throw {name: 'Forbidden', message: 'Create a CV with at least 1 experience, 1 education, and 1 skill to continue'}

            const post = await Post.findOne({where: {userId}})
            if (!post) throw {name: 'NotFound', message: 'Cannot analyze an empty post'}
            if (post.aiScore || post.aiInsight) throw {name: 'Forbidden', message: 'Analysis already generated'}
            
            const {aiScore, aiInsight} = await analyzeProfile(post.targetJob, post.criteria, cv)

            post.set({aiScore, aiInsight, updatedAt: new Date()})
            await post.save()
            await post.reload()
            res.status(200).json({message: 'Analysis created', aiScore, aiInsight})
        } catch (error) {
            next(error)
        }
    }
}

module.exports = PostController;
