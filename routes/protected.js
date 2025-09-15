import express from "express";
import { protect } from "../middlewares/authJwt.js";

const router = express.Router();

router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Bạn đã truy cập được profile!",
    user: req.user,
  });
});

/**
 * @swagger
 * /api/protected:
 *   get:
 *     summary: Truy cập API protected
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin protected
 */

router.get("/", protect, (req, res) => {
  res.json({
    message: "Đã vào protected API ✅",
    user: req.user,
  });
});


export default router;
