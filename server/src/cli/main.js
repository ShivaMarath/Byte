#!/usr/bin/env node
import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";
import { Command } from "commander";
import { login, logout, whoami } from "./commands/auth/login.js";
dotenv.config();
async function main() {
    //display a banner
    console.log(chalk.green(figlet.textSync("Byte CLI", {
        font: "Standard",
        horizontalLayout: "default",
    })));
    console.log(chalk.blue("CLI based AI assistant"));
    const program = new Command("byte");
    program
        .version("1.0.0")
        .description("CLI based AI assistant")
        .addCommand(login)
        .addCommand(logout)
        .addCommand(whoami)
        program.action(()=>{
            program.help();
        })
        program.parse();
}
main().catch((err)=>{
    console.log(chalk.red("Error occured in running the program"), err)
    process.exit(1);
});