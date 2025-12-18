/**
 * Middleware to verify if the authenticated user is an Admin.
 * This runs AFTER the 'verifyToken' middleware, which attaches the 'user' object to the request.
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const verifyAdmin = (req, res, next) => {
  // Check if the user object exists on the request (it should be there from verifyToken)
  // AND check if the 'isAdmin' property is strictly true
  if (!req.user || req.user.isAdmin !== true) {
    // If user is not an admin, return a 403 Forbidden status
    // 403 means "I know who you are, but you don't have permission"
    return res.status(403).json({ message: "Admins only" });
  }

  // If the user IS an admin, allow the request to proceed to the next handler/controller
  next();
};
