export class ChatService {
    /**
     * Create a new conversation
     * @param {string} userId - User ID
     * @param {string} mode - chat, tool, or agent
     * @param {string} title - Optional conversation title
     */
    createConversation(userId: string, mode?: string, title?: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mode: string;
        title: string | null;
    }>;
    /**
     * Get or create a conversation for user
     * @param {string} userId - User ID
     * @param {string} conversationId - Optional conversation ID
     * @param {string} mode - chat, tool, or agent
     */
    getOrCreateConversation(userId: string, conversationId?: string, mode?: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mode: string;
        title: string | null;
    }>;
    /**
     * Add a message to conversation
     * @param {string} conversationId - Conversation ID
     * @param {string} role - user, assistant, system, tool
     * @param {string|object} content - Message content
     */
    addMessage(conversationId: string, role: string, content: string | object): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        role: string;
        conversationId: string;
    }>;
    /**
     * Get conversation messages
     * @param {string} conversationId - Conversation ID
     */
    getMessages(conversationId: string): Promise<{
        content: any;
        id: string;
        createdAt: Date;
        role: string;
        conversationId: string;
    }[]>;
    /**
     * Get all conversations for a user
     * @param {string} userId - User ID
     */
    getUserConversations(userId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mode: string;
        title: string | null;
    }[]>;
    /**
     * Delete a conversation
     * @param {string} conversationId - Conversation ID
     * @param {string} userId - User ID (for security)
     */
    deleteConversation(conversationId: string, userId: string): Promise<import("../generated/prisma/index.js").Prisma.BatchPayload>;
    /**
     * Update conversation title
     * @param {string} conversationId - Conversation ID
     * @param {string} title - New title
     */
    updateTitle(conversationId: string, title: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mode: string;
        title: string | null;
    }>;
    /**
     * Helper to parse content (JSON or string)
     */
    parseContent(content: any): any;
    /**
     * Format messages for AI SDK
     * @param {Array} messages - Database messages
     */
    formatMessagesForAI(messages: any[]): {
        role: any;
        content: any;
    }[];
}
//# sourceMappingURL=chat-service.d.ts.map