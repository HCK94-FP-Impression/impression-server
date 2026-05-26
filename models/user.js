"use strict";
const { Model } = require("sequelize");
const { hashPassword } = require("../helpers/bcrypt");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasOne(models.Post, { foreignKey: "userId" });
      User.hasOne(models.Cv, { foreignKey: "userId" });
      User.hasMany(models.Rating, {
        foreignKey: "voterId",
        as: "GivenRatings",
      });
      User.hasMany(models.CommunityPost, { foreignKey: "userId" });
      User.hasMany(models.CommunityMember, { foreignKey: "userId" });
      User.hasOne(models.Community, {
        foreignKey: "leaderId",
        as: "LeadingCommunity",
      });
    }
  }
  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Username is required" },
          notEmpty: { msg: "Username cannot be empty" },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notNull: { msg: "Email is required" },
          notEmpty: { msg: "Email cannot be empty" },
          isEmail: { msg: "Email must be a valid email address" },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Password is required" },
          notEmpty: { msg: "Password cannot be empty" },
        },
      },
      quota: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
          notNull: { msg: "Quota is required" },
          isInt: { msg: "Quota must be an integer" },
          min: {
            args: [0],
            msg: "Quota cannot be negative",
          },
        },
      },
      role: {
        type: DataTypes.ENUM("job_seeker", "recruiter"),
        allowNull: false,
        defaultValue: "job_seeker",
        validate: {
          notNull: { msg: "Role is required" },
          isIn: {
            args: [["job_seeker", "recruiter"]],
            msg: "Role must be either 'job_seeker' or 'recruiter'",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "User",
    },
  );

  User.beforeCreate((user, option) => {
    user.password = hashPassword(user.password);
  });

  return User;
};
