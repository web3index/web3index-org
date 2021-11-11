"use strict";
exports.__esModule = true;
var client_1 = require("@prisma/client");
// Avoid instantiating too many instances of Prisma in development
// https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices#problem
var prisma;
if (process.env.NODE_ENV === "production") {
  prisma = new client_1.PrismaClient();
} else {
  if (!global["prisma"]) {
    global["prisma"] = new client_1.PrismaClient();
  }
  prisma = global["prisma"];
}
exports["default"] = prisma;
