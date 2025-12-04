/**
 * Role-based authorization middleware.
 * Use after `auth` middleware so req.user is populated from JWT.
 * Example: router.get("/admin", auth, authorizeRole("admin"), handler);
 */
function authorizeRole(...allowedRoles) {
  const roles = allowedRoles.flat().filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.length) {
      return next();
    }

    const userRole = req.user.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    return next();
  };
}

module.exports = authorizeRole;
