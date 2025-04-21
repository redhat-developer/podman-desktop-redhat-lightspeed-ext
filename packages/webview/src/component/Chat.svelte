<script lang="ts">
import type { DeepChat } from 'deep-chat';
import type { Signals } from 'deep-chat/dist/types/handler';
import { getContext, onMount } from 'svelte';
import { Remote } from '../remote/remote';
import { API_CHAT } from '/@common/channels';
import type { ChatPrompt } from '/@common/interface/chat-prompt-api';
import type { ChatResponseInfo } from '/@common/model/chat-response-info';
import { States } from '../state/states';
import type { TextInput } from 'deep-chat/dist/types/textInput';
import type { MessageStyles } from 'deep-chat/dist/types/messages';
import type { RemarkableOptions } from 'deep-chat/dist/types/remarkable';
import type { CustomStyle } from 'deep-chat/dist/types/styles';
import 'deep-chat';

const history: { role: string; text: string }[] = [
  { role: 'user', text: 'I have a question about RHEL ?' },
  { role: 'ai', text: 'Ask me anything about RHEL using the prompt.' },
];

const inputAreaStyle: CustomStyle = {};

const chatStyle: CustomStyle = {
  padding: '10px',
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--pd-content-bg)',
  border: 'unset',
};

const messageStyles: MessageStyles = {
  default: {
    ai: {
      bubble: {
        backgroundColor: '#18181b', // Always use the dark color else it will render cyan color for example 'var(--pd-content-card-bg)',
        color: '#e4e4e4', // Always use the light color // 'var(--pd-invert-content-card-text)',
      },
    },
    user: { bubble: { backgroundColor: 'var(--pd-button-primary-hover-bg)' } },
  },
};

const textInput: TextInput = {
  placeholder: { text: 'Ask me anything about RHEL' },
  styles: {
    container: {
      backgroundColor: 'var(--pd-input-field-bg)',
      color: 'var(--pd-input-field-focused-text)',
      borderColor: 'var(--pd-input-field-stroke)',
    },
    focus: {
      borderColor: 'var(--pd-input-field-hover-stroke)',
    },
  },
};

// Authorize html in the output
const remarkable: RemarkableOptions = { html: true, typographer: false };

const remote = getContext<Remote>(Remote);
const chatResponseSessionHandler = getContext<States>(States).chatResponseSessionHandler;
const chatClient = remote.getProxy<ChatPrompt>(API_CHAT);

let deepChatElement: DeepChat | undefined = undefined;

onMount(() => {
  deepChatElement = document.querySelector('deep-chat') ?? undefined;

  if (deepChatElement) {
    // Intercept the connect event so we can handle the query on our own

    const handleAsyncResponse = async (body: unknown, signals: Signals): Promise<void> => {
      // Receive body using a message like
      // {messages [{role: 'user', text: 'question'}]}
      const messages = body as { messages: { role: string; text: string }[] };
      const ask = messages.messages[0].text;

      const sessionId = await chatClient.createPromptSession(ask);

      const callback = (response: ChatResponseInfo): void => {
        if (response.error) {
          deepChatElement?.addMessage({
            role: 'ai',
            text: response.error,
          });
          // Displays an error message
          signals.onResponse({ text: response.error, error: response.error }).catch((error: unknown) => {
            console.error('Error displaying error message:', error);
          });
        } else {
          // Displays the response text message
          signals.onResponse({ text: response.content }).catch((error: unknown) => {
            console.error('Error displaying response message:', error);
          });
        }
      };
      // Register the callback for a later response
      chatResponseSessionHandler.subscribe(sessionId, callback);
    };

    deepChatElement.connect = {
      handler: (body: unknown, signals: Signals): void => {
        handleAsyncResponse(body, signals).catch((error: unknown) => {
          console.error('Error handling async response:', error);
        });
      },
    };

    // Set focus to the input after focus on the page
    window.addEventListener('focus', () => {
      setTimeout(() => {
        deepChatElement?.focusInput(); // Set focus to the input area
      }, 100);
    });
  }
});
</script>

<deep-chat
  chatStyle={chatStyle}
  remarkable={remarkable}
  inputAreaStyle={inputAreaStyle}
  messageStyles={messageStyles}
  history={history}
  textInput={textInput}
  demo={false}></deep-chat>
