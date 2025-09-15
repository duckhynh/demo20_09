// config/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        openapi: "3.0.0",
        info: {
            title: "Demo API",
            version: "1.0.0",
            description: "API documentation cho project demo",
        },
        servers: [{
                url: "http://localhost:5000", // khi deploy thì đổi thành link Render
            },
            {
                url: "https://demo12-09.onrender.com", // 🟢 Khi deploy Render
            },
        ],
    },
    apis: ["./routes/*.js"], // đường dẫn tới file routes để swagger đọc
};


const swaggerSpec = swaggerJSDoc(options);

function swaggerDocs(app, port) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`📖 Swagger docs chạy tại http://localhost:${port}/api-docs`);
}

export {
    swaggerDocs,
    swaggerSpec,
    swaggerUi
};