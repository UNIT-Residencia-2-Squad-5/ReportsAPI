import swaggerJsdoc from "swagger-jsdoc";
import { usersDocs } from "@/presentation/docs/users.docs";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Reports API",
      version: "1.0.0",
      description: "Documentação da API de relatórios",
    },
    paths: {
      ...usersDocs,
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
