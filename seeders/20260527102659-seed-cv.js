"use strict";

const cvs = require("../data/cvs.json");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Cvs",
      cvs.map((cv) => ({
        userId: cv.userId,
        experiences: JSON.stringify(cv.experiences),
        educations: JSON.stringify(cv.educations),
        skills: cv.skills,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Cvs", null, {});
  },
};
