"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    const now = new Date();
    const ratings = require("../data/ratings.json").map((rating) => {
      rating.createdAt = now;
      rating.updatedAt = now;
      delete rating.id;
      return rating;
    });

    await queryInterface.bulkInsert("Ratings", ratings);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("Ratings", null, {});
  },
};
