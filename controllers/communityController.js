const {
  Community,
  User,
  CommunityMember,
  CommunityPost,
  Post,
  Rating,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

class CommunityController {
  /**
   * GET /communities
   * Mengambil semua komunitas yang tersedia.
   *
   * Query params:
   * - search : string (opsional) — filter by nama komunitas (case-insensitive)
   * - domain : string (opsional) — filter by domain teknologi (javascript, python, dll)
   *
   * Response:
   * - communities : array — list komunitas beserta leader dan jumlah member approved
   */
  static async getCommunities(req, res, next) {
    try {
      const { search, domain } = req.query;

      const where = {};
      if (domain) where.domain = domain;
      if (search) where.name = { [Op.iLike]: `%${search}%` };

      const communities = await Community.findAll({
        where,
        include: [
          {
            model: User,
            as: "leader",
            attributes: ["id", "username"],
          },
          {
            model: CommunityMember,
            where: { status: "approved" },
            attributes: [],
            required: false,
          },
        ],
        attributes: {
          include: [
            [
              sequelize.fn("COUNT", sequelize.col("CommunityMembers.id")),
              "memberCount",
            ],
          ],
        },
        group: ["Community.id", "leader.id"],
      });

      res.status(200).json({ communities });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /communities/:id
   * Mengambil info basic sebuah komunitas — bisa diakses semua user yang login.
   * Digunakan untuk halaman browse/detail sebelum user join.
   *
   * Response:
   * - community       : object — data komunitas + leader
   * - memberCount     : integer — jumlah member approved
   * - membershipStatus: string | null — status membership user yang login
   *     - null      → belum pernah join
   *     - "pending" → sudah request join, menunggu approval
   *     - "approved"→ sudah jadi member
   */
  static async getCommunityById(req, res, next) {
    try {
      const { id } = req.params;
      const community = await Community.findByPk(id, {
        include: [
          {
            model: User,
            as: "leader",
            attributes: ["id", "username"],
          },
        ],
      });

      if (!community) {
        throw { name: "NotFound", message: "Community not found" };
      }

      // Hitung jumlah member yang sudah approved
      const memberCount = await CommunityMember.count({
        where: { communityId: id, status: "approved" },
      });

      // Cek status membership user yang sedang login
      const membership = await CommunityMember.findOne({
        where: { communityId: id, userId: req.user.id },
      });

      const membershipStatus = membership ? membership.status : null;

      res.status(200).json({
        community,
        memberCount,
        membershipStatus,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /communities/:id/dashboard
   * Mengambil data lengkap komunitas — hanya untuk approved member.
   *
   * Response berbeda berdasarkan role user di komunitas:
   * - Semua approved member: community detail, members list, leaderboard, statistik
   * - Leader: tambahan pendingMembers untuk keperluan approve/reject
   *
   * Response:
   * - community      : object — data komunitas + leader + members list
   * - isLeader       : boolean — apakah user yang login adalah leader
   * - pendingMembers : array — list user yang menunggu approval (hanya untuk leader)
   * - leaderboard    : object — top member berdasarkan rata-rata skor
   *     - social      : ranking berdasarkan social ratings
   *     - professional: ranking berdasarkan professional ratings
   * - statistics     : object — ringkasan data komunitas
   *     - totalMembers       : jumlah approved member
   *     - totalPosts         : jumlah forum posts
   *     - avgSocialScore     : rata-rata skor social seluruh member
   *     - avgProfessionalScore: rata-rata skor professional seluruh member
   */
  static async getCommunityDashboard(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const community = await Community.findByPk(id, {
        include: [
          {
            model: User,
            as: "leader",
            attributes: ["id", "username"],
          },
          {
            model: CommunityMember,
            where: { status: "approved" },
            required: false,
            include: [
              {
                model: User,
                attributes: ["id", "username"],
              },
            ],
          },
        ],
      });

      if (!community) {
        throw { name: "NotFound", message: "Community not found" };
      }

      // Cek apakah user adalah approved member — non-member tidak bisa akses dashboard
      const membership = await CommunityMember.findOne({
        where: { communityId: id, userId, status: "approved" },
      });

      if (!membership) {
        throw {
          name: "Forbidden",
          message: "Only approved members can access the dashboard",
        };
      }

      // Cek apakah user yang login adalah leader komunitas ini
      const isLeader = community.leaderId === userId;

      // Ambil pending members — hanya ditampilkan untuk leader (untuk keperluan approve/reject)
      let pendingMembers = [];
      if (isLeader) {
        pendingMembers = await CommunityMember.findAll({
          where: { communityId: id, status: "pending" },
          include: [
            {
              model: User,
              attributes: ["id", "username"],
            },
          ],
        });
      }

      // Ambil userId semua approved member untuk query leaderboard
      const memberUserIds = community.CommunityMembers.map((m) => m.userId);

      // Ambil semua post milik member komunitas beserta ratings-nya
      const memberPosts = await Post.findAll({
        where: { userId: memberUserIds },
        include: [
          {
            model: Rating,
            attributes: ["scores", "ratingType"],
            required: false,
          },
          {
            model: User,
            attributes: ["id", "username"],
          },
        ],
      });

      // Hitung leaderboard — dipisah antara social dan professional ratings
      const leaderboard = { social: [], professional: [] };

      memberPosts.forEach((post) => {
        const socialRatings = post.Ratings.filter(
          (r) => r.ratingType === "social",
        );
        const professionalRatings = post.Ratings.filter(
          (r) =>
            r.ratingType === "professional_recruiter" ||
            r.ratingType === "professional_same_job",
        );

        // Hitung rata-rata dari semua scores dalam satu segmen
        const calcAverage = (ratings) => {
          const allScores = ratings.flatMap((r) => r.scores);
          if (allScores.length === 0) return 0;
          return Number(
            (
              allScores.reduce((sum, s) => sum + s, 0) / allScores.length
            ).toFixed(2),
          );
        };

        leaderboard.social.push({
          userId: post.User.id,
          username: post.User.username,
          averageScore: calcAverage(socialRatings),
          totalRatings: socialRatings.length,
        });

        leaderboard.professional.push({
          userId: post.User.id,
          username: post.User.username,
          averageScore: calcAverage(professionalRatings),
          totalRatings: professionalRatings.length,
        });
      });

      // Sort descending — member dengan skor tertinggi di atas
      leaderboard.social.sort((a, b) => b.averageScore - a.averageScore);
      leaderboard.professional.sort((a, b) => b.averageScore - a.averageScore);

      // Hitung rata-rata keseluruhan per segmen untuk statistik komunitas
      const avgSocialScore =
        leaderboard.social.length > 0
          ? Number(
              (
                leaderboard.social.reduce((sum, m) => sum + m.averageScore, 0) /
                leaderboard.social.length
              ).toFixed(2),
            )
          : 0;

      const avgProfessionalScore =
        leaderboard.professional.length > 0
          ? Number(
              (
                leaderboard.professional.reduce(
                  (sum, m) => sum + m.averageScore,
                  0,
                ) / leaderboard.professional.length
              ).toFixed(2),
            )
          : 0;

      // Hitung total forum posts di komunitas ini
      const totalPosts = await CommunityPost.count({
        where: { communityId: id },
      });

      res.status(200).json({
        community,
        isLeader,
        pendingMembers,
        leaderboard,
        statistics: {
          totalMembers: memberUserIds.length,
          totalPosts,
          avgSocialScore,
          avgProfessionalScore,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /communities/:id/join
   * Request join ke sebuah komunitas.
   *
   * Behaviour:
   * - Membuat row CommunityMember dengan status "pending"
   * - Leader komunitas yang akan approve/reject via endpoint terpisah
   * - Tidak bisa join kalau sudah approved atau masih pending
   */
  static async joinCommunity(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const community = await Community.findByPk(id);
      if (!community) {
        throw { name: "NotFound", message: "Community not found" };
      }

      // Cek apakah user sudah pernah join atau masih pending
      const existingMembership = await CommunityMember.findOne({
        where: { communityId: id, userId },
      });

      if (existingMembership) {
        if (existingMembership.status === "approved") {
          throw { name: "BadRequest", message: "Already a member" };
        } else if (existingMembership.status === "pending") {
          throw { name: "BadRequest", message: "Membership pending approval" };
        }
      }

      await CommunityMember.create({
        communityId: id,
        userId,
      });

      res.status(201).json({ message: "Join request sent successfully" });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /communities/:id/members/:userId/approve
   * Approve request join dari seorang user — hanya bisa dilakukan oleh leader.
   *
   * Behaviour:
   * - Mengubah status CommunityMember dari "pending" → "approved"
   * - Hanya leader komunitas yang bisa melakukan ini
   */
  static async approveMember(req, res, next) {
    try {
      const { id, userId } = req.params;

      const community = await Community.findByPk(id);
      if (!community) {
        throw { name: "NotFound", message: "Community not found" };
      }

      // Hanya leader yang bisa approve
      if (community.leaderId !== req.user.id) {
        throw {
          name: "Forbidden",
          message: "Only the community leader can approve members",
        };
      }

      const membership = await CommunityMember.findOne({
        where: { communityId: id, userId, status: "pending" },
      });

      if (!membership) {
        throw { name: "NotFound", message: "Pending membership not found" };
      }

      await membership.update({ status: "approved" });

      res.status(200).json({ message: "Member approved successfully" });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /communities/:id/members/:userId/reject
   * Reject request join dari seorang user — hanya bisa dilakukan oleh leader.
   *
   * Behaviour:
   * - Menghapus row CommunityMember yang statusnya "pending"
   * - User bisa request join lagi setelah di-reject
   * - Hanya leader komunitas yang bisa melakukan ini
   */
  static async rejectMember(req, res, next) {
    try {
      const { id, userId } = req.params;

      const community = await Community.findByPk(id);
      if (!community) {
        throw { name: "NotFound", message: "Community not found" };
      }

      // Hanya leader yang bisa reject
      if (community.leaderId !== req.user.id) {
        throw {
          name: "Forbidden",
          message: "Only the community leader can reject members",
        };
      }

      const membership = await CommunityMember.findOne({
        where: { communityId: id, userId, status: "pending" },
      });

      if (!membership) {
        throw { name: "NotFound", message: "Pending membership not found" };
      }

      // Hapus row — user bisa request join lagi kapanpun
      await membership.destroy();

      res.status(200).json({ message: "Member rejected successfully" });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /communities/:id/posts
   * Mengambil semua forum posts di sebuah komunitas.
   * Hanya bisa diakses oleh approved member.
   *
   * Response:
   * - posts : array — list forum posts diurutkan dari terbaru, include username author
   */
  static async getCommunityPosts(req, res, next) {
    try {
      const { id } = req.params;
      const community = await Community.findByPk(id);
      if (!community) {
        throw { name: "NotFound", message: "Community not found" };
      }

      // Hanya approved member yang bisa lihat forum posts
      const userId = req.user.id;
      const membership = await CommunityMember.findOne({
        where: { communityId: id, userId, status: "approved" },
      });

      if (!membership) {
        throw {
          name: "Forbidden",
          message: "Only approved members can view posts",
        };
      }

      const posts = await CommunityPost.findAll({
        where: { communityId: id },
        include: [
          {
            model: User,
            attributes: ["id", "username"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({ posts });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /communities/:id/posts
   * Membuat forum post baru di sebuah komunitas.
   * Hanya bisa dilakukan oleh approved member.
   *
   * Request body:
   * - title   : string — judul post
   * - content : string — isi post (comments via Disqus di frontend)
   *
   * Response:
   * - post : object — data forum post yang baru dibuat
   */
  static async createCommunityPost(req, res, next) {
    try {
      const { id } = req.params;
      const community = await Community.findByPk(id);
      if (!community) {
        throw { name: "NotFound", message: "Community not found" };
      }

      // Hanya approved member yang bisa buat post
      const userId = req.user.id;
      const membership = await CommunityMember.findOne({
        where: { communityId: id, userId, status: "approved" },
      });

      if (!membership) {
        throw {
          name: "Forbidden",
          message: "Only approved members can create posts",
        };
      }

      const { title, content } = req.body;
      const newPost = await CommunityPost.create({
        communityId: id,
        userId,
        title,
        content,
      });

      res.status(201).json({ post: newPost });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CommunityController;
