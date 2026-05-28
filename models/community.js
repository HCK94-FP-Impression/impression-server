"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Community extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Community.belongsTo(models.User, {
        as: "leader",
        foreignKey: "leaderId",
      });
      Community.hasMany(models.CommunityMember, {
        foreignKey: "communityId",
      });
      Community.hasMany(models.CommunityPost, {
        foreignKey: "communityId",
      });
    }
  }
  Community.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Name is required" },
          notEmpty: { msg: "Name cannot be empty" },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: { msg: "Description is required" },
          notEmpty: { msg: "Description cannot be empty" },
        },
      },
      domain: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Domain is required" },
          notEmpty: { msg: "Domain cannot be empty" },
        },
      },
      leaderId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: "Community",
    },
  );
  return Community;
};
