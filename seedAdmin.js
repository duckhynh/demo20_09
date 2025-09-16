import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/user.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = "admin@gmail.com";
    const adminUsername = "superadmin";
    const adminPassword = "123456"; 


    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("✅ Admin đã tồn tại:", existingAdmin.email);
    } else {
      const admin = new User({
        username: adminUsername,
        email: adminEmail,
        password: adminPassword, 
        role: "admin",
        isVerified: true, 
      });

      await admin.save();
      console.log("🎉 Admin mặc định đã được tạo:", admin.email);
    }

    process.exit();
  } catch (err) {
    console.error("❌ Lỗi khi seed admin:", err);
    process.exit(1);
  }
};

seedAdmin();
