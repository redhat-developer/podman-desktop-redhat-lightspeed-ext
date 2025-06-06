/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The below file creatse a "RPC" like communication between the webview and the browser.
 * Being able to provide a simple wall to call functions between the backend and frontend portions of the extension.
 *
 * Keep note that there is a timeout of 10 seconds for each request, if the request is not answered in that time, it will be rejected.
 * So calls that take longer than 10 seconds should be avoided, this can be adjusted by increasing the timeout.
 */
import type { Disposable, Webview } from '@podman-desktop/api';
import type { WebviewApi } from '@podman-desktop/webview-api';

export interface IMessage {
  id: number;
  channel: string;
  method: string;
}

export interface IMessageRequest extends IMessage {
  args: unknown[];
}

export interface IMessageResponse extends IMessageRequest {
  status: 'error' | 'success';
  error?: string;
  body: unknown;
}

export interface ISubscribedMessage {
  id: string;
  body: any;
}

export function isMessageRequest(content: unknown): content is IMessageRequest {
  return !!content && typeof content === 'object' && 'id' in content && 'channel' in content;
}

export function isMessageResponse(content: unknown): content is IMessageResponse {
  return isMessageRequest(content) && 'status' in content;
}

// Instance has methods that are callable
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ObjectInstance<T> = {
  [key: string]: (...args: unknown[]) => unknown;
};

export class RpcExtension implements Disposable {
  #webviewDisposable: Disposable | undefined;

  #instances: Map<string, ObjectInstance<unknown>> = new Map();

  constructor(private webview: Webview) {}

  dispose(): void {
    this.#webviewDisposable?.dispose();
  }

  init(): void {
    this.#webviewDisposable = this.webview.onDidReceiveMessage(async (message: unknown) => {
      if (!isMessageRequest(message)) {
        console.error('Received incompatible message.', message);
        return;
      }

      if (!this.#instances.has(message.channel)) {
        console.error(
          `Trying to call on an unknown channel ${message.channel}. Available: ${Array.from(this.#instances.keys())}`,
        );
        throw new Error('channel does not exist.');
      }

      try {
        const result = await this.#instances.get(message.channel)?.[message.method]?.(...message.args);
        await this.webview.postMessage({
          id: message.id,
          channel: message.channel,
          body: result,
          status: 'success',
        } as IMessageResponse);
      } catch (err: unknown) {
        let errorMessage: string;
        // Depending on the object throw we try to extract the error message
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else {
          errorMessage = String(err);
        }

        await this.webview.postMessage({
          id: message.id,
          channel: message.channel,
          body: undefined,
          status: 'error',
          error: errorMessage,
        } as IMessageResponse);
      }
    });
  }

  registerInstance<T, R extends T>(channel: RpcChannel<T>, instance: R): void {
    // Convert the instance to an object with method names as keys
    this.#instances.set(channel.name, instance as ObjectInstance<unknown>);
  }

  fire<T>(channel: RpcChannel<T>, body: T): Promise<boolean> {
    return this.webview.postMessage({
      id: channel.name,
      body,
    });
  }
}

export interface Subscriber {
  unsubscribe(): void;
}

export type Listener<T> = (value: T) => void;

export class RpcBrowser {
  counter: number = 0;
  promises: Map<number, { resolve: (value: unknown) => unknown; reject: (value: unknown) => void }> = new Map();
  subscribers: Map<string, Set<Listener<unknown>>> = new Map();

  getUniqueId(): number {
    return ++this.counter;
  }

  constructor(
    private window: Window,
    private api: WebviewApi,
  ) {
    this.init();
  }

  init(): void {
    // eslint-disable-next-line sonarjs/post-message
    this.window.addEventListener('message', (event: MessageEvent) => {
      const message = event.data;
      if (isMessageResponse(message)) {
        if (!this.promises.has(message.id)) {
          console.error('Unknown message id.');
          return;
        }

        const { resolve, reject } = this.promises.get(message.id) ?? {};

        if (message.status === 'error') {
          reject?.(message.error);
        } else {
          resolve?.(message.body);
        }
        this.promises.delete(message.id);
      } else if (this.isSubscribedMessage(message)) {
        this.subscribers.get(message.id)?.forEach(handler => handler(message.body));
      } else {
        console.error('Received incompatible message.', message);
        return;
      }
    });
  }

  // Listen to data on the given channel
  on<T>(channel: RpcChannel<T>, listener: Listener<T>): Disposable {
    const f = (value: unknown): void => {
      listener(value as T);
    };

    // Add the subscriber
    this.subscribers.set(channel.name, (this.subscribers.get(channel.name) ?? new Set()).add(f));

    return {
      dispose: (): void => {
        this.subscribers.get(channel.name)?.delete(f);
      },
    };
  }

  // Get a proxy for the given channel and return a proxy object matching the interface provided.
  getProxy<T>(channel: RpcChannel<T>, options?: { noTimeoutMethods: string[] }): T {
    const noTimeoutMethodsValues = options?.noTimeoutMethods ?? [];

    const proxyHandler: ProxyHandler<object> = {
      get: (target, prop, receiver) => {
        if (typeof prop === 'string') {
          return (...args: unknown[]) => {
            return this.invoke(channel.name, noTimeoutMethodsValues, prop, ...args);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    };

    // eslint-disable-next-line no-null/no-null
    return new Proxy(Object.create(null), proxyHandler);
  }

  protected async invoke(
    channel: string,
    noTimeoutMethodsValues: string[],
    method: string,
    ...args: unknown[]
  ): Promise<unknown> {
    // Generate a unique id for the request
    const requestId = this.getUniqueId();

    const promise = new Promise((resolve, reject) => {
      this.promises.set(requestId, { resolve, reject });
    });

    // Post the message
    this.api.postMessage({
      id: requestId,
      channel,
      method,
      args,
    } as IMessageRequest);

    // Add some timeout
    if (!noTimeoutMethodsValues.includes(method)) {
      setTimeout(() => {
        const { reject } = this.promises.get(requestId) ?? {};
        if (!reject) return;
        console.error('Timeout when sending the request', args);
        reject(new Error('Timeout'));
        this.promises.delete(requestId);
      }, 5000);
    }

    // Create a Promise
    return promise;
  }
  /*
  Subscribe(msgId: string, f: Listener): Subscriber {
    this.subscribers.set(msgId, (this.subscribers.get(msgId) ?? new Set()).add(f));

    return {
      unsubscribe: (): void => {
        this.subscribers.get(msgId)?.delete(f);
      },
    };
  }*/

  isSubscribedMessage(content: any): content is ISubscribedMessage {
    return !!content && 'id' in content && 'body' in content && this.subscribers.has(content.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class RpcChannel<T> {
  constructor(private channel: string) {}

  public get name(): string {
    return this.channel;
  }
}

export function createRpcChannel<T>(channel: string): RpcChannel<T> {
  return new RpcChannel<T>(channel);
}
