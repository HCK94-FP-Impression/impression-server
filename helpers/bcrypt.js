const bcrypt = require("bcryptjs");

const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
};

const comparePassword = (inPassword, password) => {
  return bcrypt.compareSync(inPassword, password);
};

module.exports = {
  hashPassword,
  comparePassword,
};
