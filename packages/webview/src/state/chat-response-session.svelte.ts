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

import { inject, injectable, postConstruct } from 'inversify';

import type { IDisposable } from '/@/util/disposable';
import { EVENT_CHAT_RESPONSE_DATA } from '/@common/channels';
import type { ChatResponseInfo } from '/@common/model/chat-response-info';
import { RpcBrowser } from '/@common/rpc/rpc';

export interface StateSessionCallbackParams<T> {
  sessionId: number;
  callback: (data: T) => void;
  // Reason of the subscription
  description: string;
}
// Receive all the data for a session
// Dispatch the data to the right callback based on the session ID
@injectable()
export class ChatResponseSessionHandler implements IDisposable {
  #callbacks = new Map<number, (response: ChatResponseInfo) => void>();

  @inject(RpcBrowser)
  private rpcBrowser: RpcBrowser;

  #disposable: IDisposable | undefined;

  @postConstruct()
  public async init(): Promise<void> {
    const channel = EVENT_CHAT_RESPONSE_DATA;
    this.#disposable = this.rpcBrowser.on(channel, event => {
      // Do we have callbacks, then call them
      const callback = this.#callbacks.get(event.id);
      if (callback) {
        callback(event);
      }
    });
  }

  dispose(): void {
    this.#disposable?.dispose();
    this.#callbacks.clear();
  }

  public subscribe(id: number, callback: (response: ChatResponseInfo) => void): IDisposable {
    // Register the callback with data being unknown
    this.#callbacks.set(id, callback);
    const disposable: IDisposable = {
      dispose: () => {
        this.#callbacks.delete(id);
      },
    };
    return disposable;
  }
}
