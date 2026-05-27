"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Communities", [
      {
        name: "JavaScript Indonesia",
        description:
          "Komunitas developer JavaScript di Indonesia. Tempat berbagi ilmu, pengalaman, dan peluang karir di bidang JavaScript, Node.js, React, dan ekosistem JS lainnya.",
        domain: "javascript",
        leaderId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Python & Data Indonesia",
        description:
          "Komunitas Python dan Data Science di Indonesia. Fokus pada machine learning, data analysis, automation, dan pengembangan aplikasi berbasis Python.",
        domain: "python",
        leaderId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert("CommunityMembers", [
      // Community 1 - JavaScript Indonesia (communityId: 1)
      {
        communityId: 1,
        userId: 1,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 1,
        userId: 3,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 1,
        userId: 4,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 1,
        userId: 5,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 1,
        userId: 7,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 1,
        userId: 8,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 1,
        userId: 6,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 1,
        userId: 10,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Community 2 - Python & Data Indonesia (communityId: 2)
      {
        communityId: 2,
        userId: 2,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 2,
        userId: 9,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 2,
        userId: 6,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 2,
        userId: 5,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 2,
        userId: 10,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 2,
        userId: 3,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        communityId: 2,
        userId: 7,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("CommunityMembers", null, {});
    await queryInterface.bulkDelete("Communities", null, {});
  },
};
