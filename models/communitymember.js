"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CommunityMember extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CommunityMember.belongsTo(models.User, { foreignKey: "userId" });
      CommunityMember.belongsTo(models.Community, {
        foreignKey: "communityId",
      });
    }
  }
  CommunityMember.init(
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
      status: {
        type: DataTypes.ENUM("pending", "approved"),
        allowNull: false,
        defaultValue: "pending",
        validate: {
          notNull: { msg: "Status is required" },
          isIn: {
            args: [["pending", "approved"]],
            msg: "Status must be either 'pending' or 'approved'",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "CommunityMember",
    },
  );
  return CommunityMember;
};
