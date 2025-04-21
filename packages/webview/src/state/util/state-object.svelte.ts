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

import type { IDisposable } from '/@/util/disposable';
import type { RpcBrowser, RpcChannel } from '/@common/rpc/rpc';

export const StateObject = Symbol.for('StateObject');
export interface StateObject<T> extends IDisposable {
  get data(): T | undefined;
  init(): Promise<void>;
}

// Allow to receive event for a given object
export abstract class AbsStateObjectImpl<T> implements StateObject<T> {
  #data = $state<{ value: T | undefined }>({ value: undefined });

  #rpcBrowser: RpcBrowser;

  #disposable: IDisposable | undefined;

  constructor(rpcBrowser: RpcBrowser) {
    this.#rpcBrowser = rpcBrowser;
    this.#data.value = undefined;
  }

  get data(): T | undefined {
    return this.#data.value;
  }

  protected async initChannel(channel: RpcChannel<T>): Promise<void> {
    this.#disposable = this.#rpcBrowser.on(channel, value => {
      this.#data.value = value;
    });
  }

  dispose(): void {
    this.#disposable?.dispose();
  }

  abstract init(): Promise<void>;
}
