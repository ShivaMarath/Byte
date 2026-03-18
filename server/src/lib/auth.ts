
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db.js";
import { deviceAuthorization } from "better-auth/plugins";


console.log("🔍 Current working directory:", process.cwd());
console.log("🔍 All env keys:", Object.keys(process.env).filter(key => !key.includes('SECRET')));
console.log("🔍 GITHUB_CLIENT_ID exists:", !!process.env.GITHUB_CLIENT_ID);
console.log("🔍 GITHUB_CLIENT_SECRET exists:", !!process.env.GITHUB_CLIENT_SECRET);
console.log("🔍 BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
console.log("🔍 DATABASE_URL exists:", !!process.env.DATABASE_URL);
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: "http://localhost:3005",
  basePath: "/api/auth",
  trustedOrigins: ["http://localhost:3000"],
  plugins: [
    deviceAuthorization({
      expiresIn: "30m", 
      interval: "5s", 
      
    }),
  ],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      
    },
  
  },

    logger: {
        level: "debug"
    }
});