/**
 * Get enabled tools as a tools object for AI SDK
 */
export function getEnabledTools(): {} | undefined;
/**
 * Toggle a tool's enabled state
 */
export function toggleTool(toolId: any): boolean;
/**
 * Enable specific tools
 */
export function enableTools(toolIds: any): void;
/**
 * Get all enabled tool names
 */
export function getEnabledToolNames(): string[];
/**
 * Reset all tools (disable all)
 */
export function resetTools(): void;
/**
 * Available Google Generative AI tools configuration
 * Note: Tools are instantiated lazily to avoid initialization errors
 */
export const availableTools: ({
    id: string;
    name: string;
    description: string;
    getTool: () => import("ai").Tool<{}, any>;
    enabled: boolean;
} | {
    id: string;
    name: string;
    description: string;
    getTool: () => import("ai").Tool<{
        language: string;
        code: string;
    }, {
        outcome: string;
        output: string;
    }>;
    enabled: boolean;
})[];
//# sourceMappingURL=tool.config.d.ts.map