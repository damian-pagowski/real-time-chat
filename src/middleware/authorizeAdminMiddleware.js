const authorizeAdminMiddleware = async (req, reply) => {
    if (req.user.role !== "admin") {
      reply.status(403).send({ error: "Forbidden: Admins only" });
      throw new Error("Forbidden");
    }
  };
  module.exports = authorizeAdminMiddleware;