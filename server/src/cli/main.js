#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import chalk from "chalk";
import figlet from "figlet";
import { Command } from "commander";
import { login, logout, whoami } from "./commands/auth/login.js";
import { wakeup } from "./commands/ai/Wakeup.js";

async function main() {
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
        .addCommand(wakeup);

    program.action(() => {
        program.help();
    });

    program.parse();
}

main().catch((err) => {
    console.log(chalk.red("Error occured in running the program"), err);
    process.exit(1);
});