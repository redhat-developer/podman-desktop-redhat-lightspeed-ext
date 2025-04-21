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

import { API_LIGHTSPEED } from '/@common/channels';
import { RpcBrowser } from '/@common/rpc/rpc';

import type { LightspeedApi } from '../../common/src/interface/lightspeed-api';
import { InversifyBinding } from './inject/inversify-binding';
import { Remote } from './remote/remote';
import { States } from './state/states';
import { StateObject } from './state/util/state-object.svelte';
import { IDisposable } from './util/disposable';

export interface MainContext {
  remote: Remote;
  states: States;
}

export class Main implements IDisposable {
  private disposables: IDisposable[] = [];

  async init(): Promise<MainContext> {
    const webViewApi = acquirePodmanDesktopApi();

    const rpcBrowser: RpcBrowser = new RpcBrowser(window, webViewApi);

    const inversifyBinding = new InversifyBinding(rpcBrowser, webViewApi);
    const container = await inversifyBinding.initBindings();

    // Grab all state object instances
    const stateObjectInstances = container.getAll<StateObject<unknown>>(StateObject);

    // Init all state object instances
    for (const stateObjectInstance of stateObjectInstances) {
      await stateObjectInstance.init();
    }

    const client = container.get<Remote>(Remote).getProxy<LightspeedApi>(API_LIGHTSPEED);
    await client.initStates();
    client.check().catch((err: unknown) => {
      console.error('Error while checking lightspeed', err);
    });

    // Register all disposables
    const disposables = await container.getAllAsync<IDisposable>(IDisposable);
    this.disposables.push(...disposables);

    const mainContext: MainContext = {
      states: await container.getAsync<States>(States),
      remote: container.get<Remote>(Remote),
    };

    return mainContext;
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
