
import './lib/preload.js';


import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use("/api/auth", toNodeHandler(auth));
app.use(express.json());

app.get("/health", (req, res) => {
  res.send("OK");
});
app.get("/device", async (req, res) => {
  const { user_code } = req.query; 
  res.redirect(`http://localhost:3000/device?user_code=${user_code}`);
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Your app is running on ${PORT}`);
});