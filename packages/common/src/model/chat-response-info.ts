// Response of a chat prompt on lightspeed.
export interface ChatResponseInfo {
  id: number;
  content: string;
  error?: string;
}
