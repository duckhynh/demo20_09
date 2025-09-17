import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import protectedRoutes from "./routes/protected.js";
import { swaggerDocs } from "./config/swagger.js";
import userRoutes from "./routes/users.js"; 
import profileRoutes from "./routes/profile.js";


dotenv.config(); // load biến môi trường

// Kết nối MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());   // parse JSON body
const corsOptions = {
  origin: "*", // Cho phép tất cả domain (khi deploy Render thì Swagger UI vẫn gọi được API)
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));


// Mount route
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/", userRoutes);
app.use("/api/profile", profileRoutes);


// Route test nhanh
app.get("/", (req, res) => {
  res.send("Server chạy OK 🚀");
});

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  swaggerDocs(app, PORT); // gọi swagger khi server start
});

export default app;