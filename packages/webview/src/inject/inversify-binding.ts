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

import 'reflect-metadata';

import type { WebviewApi } from '@podman-desktop/webview-api';
import { Container } from 'inversify';

import { RpcBrowser } from '/@common/rpc/rpc';

import { Remote } from '../remote/remote';
import { statesModule } from '../state/state-module';

export class InversifyBinding {
  #container: Container | undefined;

  #rpcBrowser: RpcBrowser;
  #webviewApi: WebviewApi;

  constructor(rpcBrowser: RpcBrowser, webviewApi: WebviewApi) {
    this.#rpcBrowser = rpcBrowser;
    this.#webviewApi = webviewApi;
  }

  public async initBindings(): Promise<Container> {
    this.#container = new Container();
    this.#container.bind(RpcBrowser).toConstantValue(this.#rpcBrowser);

    // Bind Remote symbol
    this.#container.bind(Remote).toConstantValue(this.#rpcBrowser);
    this.#container.bind('WebviewApi').toConstantValue(this.#webviewApi);

    await this.#container.load(statesModule);

    return this.#container;
  }
}
