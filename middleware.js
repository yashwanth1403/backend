const jwt = require("jsonwebtoken");
const { JWT_secret } = require("./config");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({
      message: "error1",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decode = jwt.verify(token, JWT_secret);
    req.userId = decode.userid;
    next();
  } catch (err) {
    res.status(401).json({
      message: err,
    });
  }
};

module.exports = {
  authMiddleware,
};
