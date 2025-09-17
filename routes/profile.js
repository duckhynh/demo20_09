import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import { User } from "../models/user.js";
import { protect } from "../middlewares/authJwt.js";

const router = express.Router();
const upload = multer({ dest: "temp/" });

// Cấu hình Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: API cho user tự quản lý profile
 */

/**
 * @swagger
 * /api/profile/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 */
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -refreshToken -otp -otpExpire");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update profile user hiện tại
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/", protect, async (req, res) => {
  try {
    const updates = { username: req.body.username, email: req.body.email };
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select("-password -refreshToken");

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    res.json({ message: "Cập nhật profile thành công", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/profile/avatar:
 *   post:
 *     summary: Upload avatar cho user hiện tại
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload avatar thành công
 */
router.post("/avatar", protect, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Chưa chọn file" });

    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: "avatars",
      public_id: `${req.user._id}_${Date.now()}`,
      overwrite: true,
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.secure_url },
      { new: true }
    ).select("-password -refreshToken");

    res.json({ message: "Upload avatar thành công", avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
