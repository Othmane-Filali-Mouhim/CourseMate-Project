import jwt from "jsonwebtoken";

// This function runs BEFORE any protected route
export function protect(req, res, next) {
  // Get token from the request header
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey123");
    
    // Attach user info to the request so routes can use it
    req.user = decoded;
    
    // Move on to the actual route
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
}

// Only allow a specific role to access a route
export function restrictTo(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(400).json({ message: "Access denied" });
    }
    next();
  };
}