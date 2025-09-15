import fs from "fs";

const encoded = fs.readFileSync(".env.encoded", "utf8");
const decoded = Buffer.from(encoded, "base64").toString("utf8");
fs.writeFileSync(".env", decoded);

console.log("✅ .env đã được giải mã từ .env.encoded");
