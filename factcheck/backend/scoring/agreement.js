// backend/middleware/agreement.js

export default function agreement(req, res, next) {
  try {
    const agreed = req.headers["x-user-agreement"];

    // simple gate check
    if (!agreed || agreed !== "true") {
      return res.status(403).json({
        error: "User agreement not accepted",
        message: "Verification service requires user agreement header"
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Agreement middleware failure" });
  }
}
