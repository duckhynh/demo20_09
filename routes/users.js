import express from "express";
import {
  User
} from "../models/user.js";
import {
  protect,
  adminOnly
} from "../middlewares/authJwt.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API quản lý User (chỉ Admin)(adminUsername = "superadmin"  adminPassword = "123456") 
 * 
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Tạo user mới (Admin Only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User được tạo thành công
 */
router.post("/users", protect, adminOnly, async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({
      message: "Tạo user thành công",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy toàn bộ danh sách User (Admin Only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách user
 */
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken -otp -otpExpire");
    res.json(users);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Lấy thông tin 1 user theo _id (Admin Only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin user
 *       404:
 *         description: User không tồn tại
 */
router.get("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("_id username email role isVerified");
    if (!user) return res.status(404).json({
      message: "User không tồn tại"
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Cập nhật thông tin user theo _id (Admin Only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: User không tồn tại
 */
router.put("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body, {
        new: true,
        runValidators: true
      }
    ).select("_id username email role isVerified");

    if (!user) return res.status(404).json({
      message: "User không tồn tại"
    });

    res.json({
      message: "Cập nhật thành công",
      user
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Xoá user (isVerified = false) theo _id (Admin Only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Khóa user thành công (isVerified = false)
 *       404:
 *         description: User không tồn tại
 */
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, {
        isVerified: false
      }, {
        new: true
      }
    ).select("_id username email role isVerified");

    if (!user) return res.status(404).json({
      message: "User không tồn tại"
    });

    res.json({
      message: "User đã bị khóa (isVerified = false)",
      user
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

export default router;