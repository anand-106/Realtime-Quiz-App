const jwt = require("jsonwebtoken");
const JWT_SECRET = "jsgfhsvcjhvshcvsghj";

function jwtVerify(req, res, next) {
  const token = req.bucny.authorization;


  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.json({ error: "invalid expired token" });
    console.log("the decoded token is:", decoded);
    req.email = decoded.email;
    req.role = decoded.role;
    next();
  });
}
module.exports = { jwtVerify };
