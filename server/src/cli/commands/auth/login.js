import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs/promises";
import open from "open";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod";

const DEMO_URL = process.env.BYTE_API_URL ?? "https://byte-7lsq.onrender.com";
const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function getStoredToken() {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf-8");
    const token = JSON.parse(data);
    return token;
  } catch (error) {
    return null;
  }
}

export async function storeToken(token) {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    const tokenData = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: token.token_type || "Bearer",
      scope: token.scope,
      expires_at: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
      created_at: new Date().toISOString(),
    };
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(chalk.red("Failed to store token:"), error.message);
    return false;
  }
}

export async function clearStoredToken() {
  try {
    await fs.unlink(TOKEN_FILE);
    return true;
  } catch (error) {
    return false;
  }
}

export async function isTokenExpired() {
  const token = await getStoredToken();
  if (!token || !token.expires_at) {
    return true;
  }
  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
}

export async function requireAuth() {
  const token = await getStoredToken();
  if (!token) {
    console.log(chalk.red("❌ Not authenticated. Please run 'byte login' first."));
    process.exit(1);
  }
  if (await isTokenExpired()) {
    console.log(chalk.yellow("⚠️  Your session has expired. Please login again."));
    console.log(chalk.gray("   Run: byte login\n"));
    process.exit(1);
  }
  return token;
}

export async function loginAction(opts) {
  const options = z
    .object({
      serverUrl: z.string().optional(),
      clientId: z.string().optional(),
    })
    .parse(opts);

  const serverUrl = options.serverUrl || DEMO_URL;
  const clientId = options.clientId || process.env.GITHUB_CLIENT_ID;

  intro(chalk.bold("🔐 CLI Login"));

  if (!clientId) {
    console.log(chalk.red("\n❌ Please set GITHUB_CLIENT_ID in your .env file"));
    process.exit(1);
  }

  const existingToken = await getStoredToken();
  const expired = await isTokenExpired();

  if (existingToken && !expired) {
    const shouldReauth = await confirm({
      message: "You're already logged in. Do you want to log in again?",
      initialValue: false,
    });

    if (isCancel(shouldReauth) || !shouldReauth) {
      cancel("Login cancelled");
      process.exit(0);
    }
  }

  const authClient = createAuthClient({
    baseURL: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });

  const spinner = yoctoSpinner({ text: "Requesting device authorization..." });
  spinner.start();

  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId,
      scope: "openid profile email",
    });

    spinner.stop();

    if (error || !data) {
      if (error?.status === 404) {
        console.log(chalk.red("\n❌ Device authorization endpoint not found."));
        console.log(chalk.yellow("   Make sure your auth server is running."));
      } else if (error?.status === 400) {
        console.log(chalk.red("\n❌ Bad request - check your CLIENT_ID configuration."));
      } else {
        console.log(chalk.red(`\n❌ ${error?.error_description || error?.message || "Unknown error"}`));
      }
      process.exit(1);
    }

    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      interval = 5,
      expires_in,
    } = data;

    console.log("");
    console.log(chalk.cyan("📱 Device Authorization Required"));
    console.log("");
    console.log(`Please visit: ${chalk.underline.blue(verification_uri_complete || verification_uri)}`);
    console.log(`Enter code: ${chalk.bold.green(user_code)}`);
    console.log("");

    const shouldOpen = await confirm({
      message: "Open browser automatically?",
      initialValue: true,
    });

    if (!isCancel(shouldOpen) && shouldOpen) {
      const urlToOpen = verification_uri_complete || verification_uri;
      await open(urlToOpen);
    }

    console.log(chalk.gray(`Waiting for authorization (expires in ${Math.floor(expires_in / 60)} minutes)...`));

    const token = await pollForToken(authClient, device_code, clientId, interval);

    if (token) {
      const saved = await storeToken(token);

      if (!saved) {
        console.log(chalk.yellow("\n⚠️  Warning: Could not save authentication token."));
        console.log(chalk.yellow("   You may need to login again on next use."));
      }

      outro(chalk.green("✅ Login successful!"));
      console.log(chalk.gray(`\n📁 Token saved to: ${TOKEN_FILE}`));
      console.log(chalk.gray("   You can now use AI commands without logging in again.\n"));
    }
  } catch (err) {
    spinner.stop();
    console.error(chalk.red("\nLogin failed:"), err.message);
    process.exit(1);
  }
}

async function pollForToken(authClient, deviceCode, clientId, initialInterval) {
  let pollingInterval = initialInterval;
  const spinner = yoctoSpinner({ text: "", color: "cyan" });
  let dots = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      dots = (dots + 1) % 4;
      spinner.text = chalk.gray(`Polling for authorization${".".repeat(dots)}${" ".repeat(3 - dots)}`);
      if (!spinner.isSpinning) spinner.start();

      try {
        const { data, error } = await authClient.device.token({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: clientId,
          fetchOptions: {
            headers: { "user-agent": "Better Auth CLI" },
          },
        });

        if (data?.access_token) {
          spinner.stop();
          resolve(data);
          return;
        } else if (error) {
          switch (error.error) {
            case "authorization_pending":
              break;
            case "slow_down":
              pollingInterval += 5;
              break;
            case "access_denied":
              spinner.stop();
              console.log(chalk.red("Access was denied by the user"));
              process.exit(1);
              break;
            case "expired_token":
              spinner.stop();
              console.log(chalk.red("The device code has expired. Please try again."));
              process.exit(1);
              break;
            default:
              spinner.stop();
              console.log(chalk.red(`Error: ${error.error_description}`));
              process.exit(1);
          }
        }
      } catch (err) {
        spinner.stop();
        console.log(chalk.red(`Network error: ${err.message}`));
        process.exit(1);
      }

      setTimeout(poll, pollingInterval * 1000);
    };

    setTimeout(poll, pollingInterval * 1000);
  });
}

export async function logoutAction() {
  intro(chalk.bold("👋 Logout"));

  const token = await getStoredToken();

  if (!token) {
    console.log(chalk.yellow("You're not logged in."));
    process.exit(0);
  }

  const shouldLogout = await confirm({
    message: "Are you sure you want to logout?",
    initialValue: false,
  });

  if (isCancel(shouldLogout) || !shouldLogout) {
    cancel("Logout cancelled");
    process.exit(0);
  }

  const cleared = await clearStoredToken();

  if (cleared) {
    outro(chalk.green("✅ Successfully logged out!"));
  } else {
    console.log(chalk.yellow("⚠️  Could not clear token file."));
  }
}

export async function whoamiAction(opts) {
  const token = await requireAuth();

  if (!token?.access_token) {
    console.log(chalk.red("No access token found. Please login."));
    process.exit(1);
  }

  const serverUrl = opts.serverUrl || DEMO_URL;

  try {
    const response = await fetch(`${serverUrl}/api/me`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.log(chalk.yellow("\nNo user information available."));
      if (body?.error) console.log(chalk.red(`   Reason: ${body.error}`));
      process.exit(1);
    }

    const session = await response.json();
    const user = session.user;

    console.log(chalk.bold.greenBright(`\n👤 User:  ${user.name || "N/A"}`));
    console.log(chalk.green(`📧 Email: ${user.email || "N/A"}`));
    console.log(chalk.green(`🪪  ID:    ${user.id || "N/A"}`));
    if (user.image) {
      console.log(chalk.green(`🖼️  Image: ${user.image}`));
    }
    console.log("");
  } catch (err) {
    console.error(chalk.red("\nError getting user info:"), err.message);
    process.exit(1);
  }
}

export const login = new Command("login")
  .description("Login to Better Auth")
  .option("--server-url <url>", "The Better Auth server URL")
  .option("--client-id <id>", "The OAuth client ID")
  .action(loginAction);

export const logout = new Command("logout")
  .description("Logout and clear stored credentials")
  .action(logoutAction);

export const whoami = new Command("whoami")
  .description("Show current authenticated user")
  .option("--server-url <url>", "The Better Auth server URL")
  .action(whoamiAction);