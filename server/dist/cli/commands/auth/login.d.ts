export function getStoredToken(): Promise<any>;
export function storeToken(token: any): Promise<boolean>;
export function clearStoredToken(): Promise<boolean>;
export function isTokenExpired(): Promise<boolean>;
export function requireAuth(): Promise<any>;
export function loginAction(opts: any): Promise<void>;
export function logoutAction(): Promise<void>;
export function whoamiAction(opts: any): Promise<void>;
export const login: Command;
export const logout: Command;
export const whoami: Command;
import { Command } from "commander";
//# sourceMappingURL=login.d.ts.map