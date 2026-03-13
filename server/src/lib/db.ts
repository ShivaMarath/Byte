import { PrismaClient } from "@prisma/client";
const Globalprisma = global;
const prisma = new PrismaClient();
if(process.env.NODE_ENV != "production"){Globalprisma.prisma = prisma}