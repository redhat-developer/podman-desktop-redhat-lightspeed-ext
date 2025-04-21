export const ChatPrompt = Symbol.for('ChatPrompt');
export interface ChatPrompt {
  createPromptSession(message: string): Promise<number>;
}
