import dotenv from 'dotenv'
dotenv.config();

export const config = {
    googleApiKey : process.env.googleApiKey || "",
    model : process.env.model || "gemini-2.5-flash"
}