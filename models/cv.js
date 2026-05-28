"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Cv extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Cv.belongsTo(models.User, { foreignKey: "userId" });
    }
  }
  Cv.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        validate: {
          notNull: { msg: "User ID is required" },
          isInt: { msg: "User ID must be an integer" },
        },
      },
      experiences: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      educations: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      skills: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: "Cv",
    },
  );
  return Cv;
};
