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

import { RunResult } from '@podman-desktop/api';
import { AnsiUp } from 'ansi_up';
import { inject, injectable } from 'inversify';

import { API_CHAT, EVENT_CHAT_RESPONSE_DATA } from '/@common/channels';
import type { ChatPrompt } from '/@common/interface/chat-prompt-api';
import type { LightspeedApi } from '/@common/interface/lightspeed-api';
import { ChatResponseInfo } from '/@common/model/chat-response-info';
import type { RpcChannel } from '/@common/rpc';
import { RpcExtension } from '/@common/rpc/rpc';

import { LightspeedContainerHelper } from '../helper/lightspeed-container-helper';
import type { Controller } from './controller-api';

@injectable()
export class ChatPromptImpl implements ChatPrompt, Controller<ChatPrompt> {
  #sessionId: number = 0;

  #ansiup = new AnsiUp();

  @inject(RpcExtension)
  private rpcExtension: RpcExtension;

  @inject(LightspeedContainerHelper)
  lightspeedContainerHelper: LightspeedContainerHelper;

  getChannel(): RpcChannel<LightspeedApi> {
    return API_CHAT;
  }

  async createPromptSession(message: string): Promise<number> {
    // Increment counter
    const updated = this.#sessionId++;

    // Return the response as soon as possible
    // But in the meantime, send the message to the container
    // To be processed
    this.lightspeedContainerHelper
      .invokeLightspeedContainer(message)
      .then((result: RunResult) => {
        console.log('Chat response raw stdout:', result.stdout);
        console.log('Chat response raw stderr:', result.stderr);

        // Replace the # character by \# to avoid
        // The markdown parser to interpret it as a heading
        const skipHeadingOut = result.stdout.replace(/#/g, '\\#');

        // Remove any backtick that are not properly removed by lightspeed
        const skipBacktickOut = skipHeadingOut.replace(/`/g, '');

        const htmlOut = this.#ansiup.ansi_to_html(skipBacktickOut);

        const data: ChatResponseInfo = {
          id: updated,
          content: htmlOut,
        };
        // Broadcast the response to the UI
        this.rpcExtension.fire(EVENT_CHAT_RESPONSE_DATA, data).catch((error: unknown) => {
          console.error('Error broadcasting chat response data:', error);
        });
      })
      .catch((error: unknown) => {
        const data: ChatResponseInfo = {
          id: updated,
          content: '',
          error: String(error),
        };
        // Broadcast the response to the UI
        this.rpcExtension.fire(EVENT_CHAT_RESPONSE_DATA, data).catch((error: unknown) => {
          console.error('Error broadcasting chat response data:', error);
        });
        console.error('Error invoking lightspeed container:', error);
      });

    return updated;
  }
}
