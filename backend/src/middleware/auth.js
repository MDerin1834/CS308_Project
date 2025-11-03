const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr || !hdr.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const token = hdr.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role || "customer" };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
