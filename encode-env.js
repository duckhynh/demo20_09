// encode-env.js (ESM style)
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const encoded = Buffer.from(env).toString("base64");
fs.writeFileSync(".env.encoded", encoded);

console.log(".env đã được encode thành .env.encoded");
