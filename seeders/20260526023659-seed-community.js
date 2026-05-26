"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Communities", [
      {
        name: "JavaScript Indonesia",
        description:
          "Komunitas developer JavaScript di Indonesia. Tempat berbagi ilmu, pengalaman, dan peluang karir di bidang JavaScript.",
        domain: "javascript",
        leaderId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert("CommunityMembers", [
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
        userId: 6,
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
