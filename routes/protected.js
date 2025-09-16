import express from "express";
import { protect, authorize } from "../middlewares/authJwt.js";

const router = express.Router();

// Route chỉ user login được
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Bạn đã truy cập được profile!",
    user: req.user,
  });
});

// Route chỉ admin mới vào được
router.get("/admin", protect, authorize("admin"), (req, res) => {
  res.json({
    message: "Chào admin!",
    user: req.user,
  });
});

/**
 * @swagger
 * /api/protected:
 *   get:
 *     summary: Truy cập API protected cho cả user & admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin protected
 */
router.get("/", protect, authorize("user", "admin"), (req, res) => {
  res.json({
    message: "Đã vào protected API ✅",
    user: req.user,
  });
});

export default router;
