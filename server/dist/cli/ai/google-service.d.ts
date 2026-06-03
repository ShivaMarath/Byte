export class AIService {
    model: import("@ai-sdk/provider").LanguageModelV3;
    /**
     * Send a message and get streaming response
     * @param {Array} messages - Array of message objects {role, content}
     * @param {Function} onChunk - Callback for each text chunk
     * @param {Object} tools - Optional tools object
     * @param {Function} onToolCall - Callback for tool calls
     * @returns {Promise<Object>} Full response with content, tool calls, and usage
     */
    sendMessage(messages: any[], onChunk: Function, tools?: Object, onToolCall?: Function): Promise<Object>;
    /**
     * Get a non-streaming response
     * @param {Array} messages - Array of message objects
     * @param {Object} tools - Optional tools
     * @returns {Promise<string>} Response text
     */
    getMessage(messages: any[], tools?: Object): Promise<string>;
    /**
     * Generate structured output using a Zod schema
     * @param {Object} schema - Zod schema
     * @param {string} prompt - Prompt for generation
     * @returns {Promise<Object>} Parsed object matching the schema
     */
    generateStructured(schema: Object, prompt: string): Promise<Object>;
}
//# sourceMappingURL=google-service.d.ts.map