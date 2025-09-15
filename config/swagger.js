// config/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Demo API",
      version: "1.0.0",
      description: "API documentation cho project demo",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    servers: [
      {
        url: "/", // 🟢 auto dùng domain hiện tại (Render hoặc local đều ok)
      },
    ],
  },
  apis: ["./routes/*.js"], // đường dẫn tới file routes để swagger đọc
};

const swaggerSpec = swaggerJSDoc(options);

function swaggerDocs(app, port) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // log ra đúng URL trong cả local và Render
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
  console.log(`📖 Swagger docs chạy tại ${baseUrl}/api-docs`);
}

export { swaggerDocs, swaggerSpec, swaggerUi };
