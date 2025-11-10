// middleware/roleCheck.js
function checkSuperuser(req, res, next) {
  if (req.user && req.user.role === "superuser") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Superuser only" });
}

function checkOSA(req, res, next) {
  if (req.user && req.user.role === "osa") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: OSA only" });
}

function checkSecurity(req, res, next) {
  if (req.user && req.user.role === "security") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Security only" });
}

module.exports = {
  checkSuperuser,
  checkOSA,
  checkSecurity,
};
