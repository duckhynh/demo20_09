import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/user.js";

dotenv.config();

/**
 * Middleware bắt buộc login
 */
export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User không tồn tại" });
    next();
  } catch (err) {
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};

/**
 * Middleware tuỳ chọn login (có token thì decode, không có vẫn cho qua)
 */
export const protectOptional = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (err) {
      req.user = null; // Token sai thì bỏ qua
    }
  }
  next(); // Cho đi tiếp kể cả khi không có token
};

/**
 * Middleware check role
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Không đủ quyền truy cập!" });
    }
    next();
  };
};

/**
 * Middleware chỉ cho admin
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Chỉ admin mới được phép!" });
  }
};
