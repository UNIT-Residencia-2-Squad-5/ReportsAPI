export const usersDocs = {
  "/api/users": {
    get: {
      summary: "Lista todos os usuários",
      tags: ["Users"],
      responses: {
        200: { description: "Lista de usuários retornada com sucesso" },
      },
    },
    post: {
      summary: "Cria um novo usuário",
      tags: ["Users"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["nome", "email", "password"],
              properties: {
                name: { type: "string", example: "José" },
                email: { type: "string", example: "jose@email.com" },
                password: {type: "string", example: "abcdefg123456#"},
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Usuário criado com sucesso" },
        409: { description: "Email já existe" },
        500: {description: "Erro interno do servidor" },
      },
    }
  }
};
