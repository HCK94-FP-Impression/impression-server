"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Rating extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Rating.belongsTo(models.Post, { foreignKey: "postId" });
      Rating.belongsTo(models.User, { foreignKey: "voterId", as: "Voter" });
    }
  }
  Rating.init(
    {
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Post ID is required" },
          isInt: { msg: "Post ID must be an integer" },
        },
      },
      voterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Voter ID is required" },
          isInt: { msg: "Voter ID must be an integer" },
        },
      },
      scores: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        validate: {
          notNull: { msg: "Scores are required" },
          isArrayOfIntegers(value) {
            if (!Array.isArray(value) || !value.every(Number.isInteger)) {
              throw new Error("Scores must be an array of integers");
            }
          },
        },
      },
      ratingType: {
        type: DataTypes.ENUM(
          "social",
          "professional_recruiter",
          "professional_same_job",
        ),
        allowNull: false,
        validate: {
          notNull: { msg: "Rating type is required" },
          isIn: {
            args: [
              ["social", "professional_recruiter", "professional_same_job"],
            ],
            msg: "Invalid rating type",
          },
        },
      },
      insight: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "Rating",
    },
  );
  return Rating;
};
