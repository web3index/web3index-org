import { PrismaClient } from "@prisma/client";

// Avoid instantiating too many instances of Prisma in development
// https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices#problem
let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global["prisma"]) {
    global["prisma"] = new PrismaClient();
  }
  prisma = global["prisma"];
}

export default prisma;
