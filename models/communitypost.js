"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CommunityPost extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CommunityPost.belongsTo(models.User, { foreignKey: "userId" });
      CommunityPost.belongsTo(models.Community, { foreignKey: "communityId" });
    }
  }
  CommunityPost.init(
    {
      communityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Community ID is required" },
          isInt: { msg: "Community ID must be an integer" },
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "User ID is required" },
          isInt: { msg: "User ID must be an integer" },
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Title is required" },
          notEmpty: { msg: "Title cannot be empty" },
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: { msg: "Content is required" },
          notEmpty: { msg: "Content cannot be empty" },
        },
      },
    },
    {
      sequelize,
      modelName: "CommunityPost",
    },
  );
  return CommunityPost;
};
