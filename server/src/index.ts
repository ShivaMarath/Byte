import express from "express";
import dotenv from "dotenv";
const app = express();
dotenv.config()
app.get("/health", (req,res)=>{
    res.send("OK")
})

app.listen(process.env.PORT, ()=>{
    console.log("Your app is running on 3005");
});