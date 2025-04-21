import type { ChatPrompt } from './interface/chat-prompt-api';
import { type LightspeedApi } from './interface/lightspeed-api';
import type { ChatResponseInfo } from './model/chat-response-info';
import { type LightspeedStateInfo } from './model/lightspeed-state-info';
import { createRpcChannel } from './rpc';

// RPC channels (used by the webview to send requests to the extension)
export const API_LIGHTSPEED = createRpcChannel<LightspeedApi>('LightspeedApi');
export const API_CHAT = createRpcChannel<ChatPrompt>('ChatPrompt');

// Broadcast events (sent by extension and received by the webview)
export const EVENT_LIGHTSPEED_STATE = createRpcChannel<LightspeedStateInfo>('LightspeedStateInfo');
export const EVENT_CHAT_RESPONSE_DATA = createRpcChannel<ChatResponseInfo>('ChatResponseInfo');
