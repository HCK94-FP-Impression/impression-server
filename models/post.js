"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Post.belongsTo(models.User, { foreignKey: "userId" });
      Post.hasMany(models.Rating, { foreignKey: "postId" });
    }
  }
  Post.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "User ID is required" },
          isInt: { msg: "User ID must be an integer" },
        },
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Image URL is required" },
          notEmpty: { msg: "Image URL cannot be empty" },
        },
      },
      targetJob: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Target Job is required" },
          notEmpty: { msg: "Target Job cannot be empty" },
        },
      },
      criteria: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        validate: {
          notNull: { msg: "Criteria is required" },
          isValidCriteria(value) {
            if (!Array.isArray(value) || value.length === 0) {
              throw new Error("Criteria must be a non-empty array of strings");
            }
          },
        },
      },
      aiScore: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      aiInsight: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Post",
    },
  );
  return Post;
};
