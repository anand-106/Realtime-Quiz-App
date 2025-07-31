const jwt = require("jsonwebtoken");
const JWT_SECRET = "jsgfhsvcjhvshcvsghj";

function jwtVerify(req, res, next) {
  const token = req.headers.authorization;

  console.log("the token is", token);

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.json({ error: "invalid or expired token" });
    console.log("the decoded token is:", decoded);
    req.email = decoded.email;
    req.role = decoded.role;
    next();
  });
}
module.exports = { jwtVerify };
