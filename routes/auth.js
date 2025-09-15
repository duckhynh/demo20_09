import bcrypt from "bcrypt";
import express from "express";
import { User } from "../models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendMail } from "../config/mailer.js";

dotenv.config();
const router = express.Router();

/**
 * ================= REGISTER =================
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký user mới (gửi OTP email)
 *     tags: [Auth]
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
 *       201:
 *         description: Tạo user thành công, OTP đã gửi email
 *       400:
 *         description: Username/Email đã tồn tại hoặc email không hợp lệ
 */
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const usernameExists = await User.findOne({ username });
    if (usernameExists) return res.status(400).json({ message: "Username đã tồn tại" });

    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ message: "Email đã tồn tại" });

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: "Email không hợp lệ" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

  // Use model pre-save hook to hash password (avoid double-hashing)
  const newUser = new User({ username, email, password, otp, otpExpire, isVerified: false });
  const user = await newUser.save();

    try {
      await sendMail(
        email,
        "Mã OTP đăng ký tài khoản",
        `Chào ${username}, mã OTP của bạn là: ${otp}. Có hiệu lực 10 phút.`
      );
    } catch (mailErr) {
      await User.deleteOne({ _id: user._id });
      return res.status(400).json({ message: "Không gửi được email OTP" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email },
      token,
      message: "Vui lòng kiểm tra email để lấy OTP và xác thực tài khoản.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ================= VERIFY OTP =================
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Xác thực tài khoản bằng OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP hợp lệ, tài khoản kích hoạt
 *       400:
 *         description: OTP không hợp lệ hoặc hết hạn
 *       404:
 *         description: User không tồn tại
 */
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    if (!user.otp || !user.otpExpire) return res.status(400).json({ message: "OTP không tồn tại hoặc hết hạn" });
    if (user.otp !== otp) return res.status(400).json({ message: "OTP không đúng" });
    if (user.otpExpire < new Date()) return res.status(400).json({ message: "OTP đã hết hạn" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    res.json({ message: "Xác thực OTP thành công. Tài khoản đã kích hoạt." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ================= LOGIN =================
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập user (cần OTP đã xác thực)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về JWT token
 *       400:
 *         description: Email hoặc mật khẩu không đúng
 *       403:
 *         description: Tài khoản chưa xác thực OTP
 */
// ================= LOGIN =================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

    // Kiểm tra xác thực OTP trước
    if (!user.isVerified) return res.status(403).json({ message: "Tài khoản chưa xác thực OTP" });

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

    // Tạo accessToken
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Loại bỏ password trước khi trả về client
    const { password: _, ...userData } = user.toObject();

    res.json({
      message: "Đăng nhập thành công",
      profile: userData,
      accessToken
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server lỗi, thử lại sau 😅", error: err });
  }
});

/**
 * ================= FORGOT PASSWORD =================
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Yêu cầu OTP để reset mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP đã gửi email
 *       404:
 *         description: User không tồn tại
 */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();

    await sendMail(email, "Mã OTP đặt lại mật khẩu", `Mã OTP của bạn: ${otp}. Hiệu lực 10 phút.`);

    res.json({ message: "OTP đã được gửi tới email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ================= RESET PASSWORD =================
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: OTP không hợp lệ hoặc hết hạn
 *       404:
 *         description: User không tồn tại
 */
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    if (!user.otp || !user.otpExpire) return res.status(400).json({ message: "OTP không tồn tại hoặc hết hạn" });
    if (user.otp !== otp) return res.status(400).json({ message: "OTP không đúng" });
    if (user.otpExpire < new Date()) return res.status(400).json({ message: "OTP đã hết hạn" });

  // Let model pre-save hook hash the password
  user.password = newPassword;
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
