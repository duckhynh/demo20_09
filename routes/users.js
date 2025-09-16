import express from "express";
import { User } from "../models/user.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API quản lý User
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Tạo user mới
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: User được tạo thành công
 */
router.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ 
      message: "Tạo user thành công", 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy toàn bộ danh sách User
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Danh sách user
 *         content:
 *           application/json:
 *             example:
 *               - _id: "650d3d4f7b6d8f1e2432abcd"
 *                 username: "hungdev"
 *                 email: "hung@example.com"
 *                 isVerified: true
 *               - _id: "650d3d4f7b6d8f1e2432abce"
 *                 username: "duckhynh"
 *                 email: "duckhynh@example.com"
 *                 isVerified: false
 */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken -otp -otpExpire"); 
    // bỏ password, refreshToken, otp cho an toàn
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Lấy thông tin 1 user theo _id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về thông tin user
 *       404:
 *         description: User không tồn tại
 */
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("_id username email isVerified");
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Cập nhật thông tin user theo _id
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: User không tồn tại
 */
router.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .select("_id username email isVerified");
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    res.json({ message: "Cập nhật thành công", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Xóa user theo _id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: User không tồn tại
 */
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id).select("_id username email");
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    res.json({ message: "Xóa user thành công", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
