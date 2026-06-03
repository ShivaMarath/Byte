import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../auth/login.js";
import { select } from "@clack/prompts";
import { startChat } from "../../chat/chat-with-ai.js";
import { startToolChat } from "../../chat/chat-with-ai-tools.js";
import { startAgentChat } from "../../chat/chat-with-ai-agent.js";

const API_BASE = process.env.BYTE_API_URL ?? "https://byte-7lsq.onrender.com";

const wakeUpAction = async () => {
  const token = await getStoredToken();

  if (!token?.access_token) {
    console.log(chalk.red("Not authenticated. Please login."));
    return;
  }

  const spinner = yoctoSpinner({ text: "Fetching User Information..." });
  spinner.start();

  let user;
  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: {
        authorization: `Bearer ${token.access_token}`,
      },
    });

    if (!res.ok) {
      spinner.stop();
      console.log(chalk.red("Failed to fetch user. Please login again."));
      return;
    }

    const session = await res.json();
    user = session.user;
  } catch (err) {
    spinner.stop();
    console.log(chalk.red("Could not reach server."), err);
    return;
  }

  spinner.stop();

  if (!user) {
    console.log(chalk.red("User not found."));
    return;
  }

  console.log(chalk.green(`\nWelcome back, ${user.name}!\n`));

  const choice = await select({
    message: "Select an option:",
    options: [
      { value: "chat", label: "Chat", hint: "Simple chat with AI" },
      { value: "tool", label: "Tool Calling", hint: "Chat with tools (Google Search, Code Execution)" },
      { value: "agent", label: "Agentic Mode", hint: "Advanced AI agent (Coming soon)" },
    ],
  });

  switch (choice) {
    case "chat":
      await startChat("chat");
      break;
    case "tool":
      await startToolChat();
      break;
    case "agent":
      await startAgentChat();
      break;
  }
};

export const wakeup = new Command("wakeup")
  .description("Wake up the AI")
  .action(wakeUpAction);