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

import { type Disposable } from '@podman-desktop/api';
import { inject, injectable, postConstruct } from 'inversify';

import { RpcExtension } from '/@common/rpc/rpc';

import { LightspeedState, type LightspeedStateInfo } from '../../../common/src/model/lightspeed-state-info';
import { EVENT_LIGHTSPEED_STATE } from '/@common/channels';
import { LightspeedContainerHelper } from '../helper/lightspeed-container-helper';

@injectable()
export class StateManager implements Disposable {
  #state: LightspeedStateInfo | undefined;

  @inject(RpcExtension)
  private rpcExtension: RpcExtension;

  @inject(LightspeedContainerHelper)
  lightspeedContainerHelper: LightspeedContainerHelper;

  constructor() {
    this.#state = undefined;
  }

  @postConstruct()
  init(): void {
    this.start().catch((err: unknown) => {
      console.error('Error loading models:', err);
    });
  }

  async initStates(): Promise<void> {
    await this.broadcastStateInfo();
  }

  async check(): Promise<void> {
    return this.start();
  }

  protected async start(): Promise<void> {
    // First, initializing state
    this.#state = {
      status: LightspeedState.INITIALIZING,
    };
    await this.broadcastStateInfo();

    try {
      await this.lightspeedContainerHelper.ensureLightspeedContainerStarted();
    } catch (error: unknown) {
      this.#state.status = LightspeedState.ERROR;
      this.#state.error = String(error);
      await this.broadcastStateInfo();
      return;
    }

    this.#state = {
      status: LightspeedState.STARTING,
    };
    await this.broadcastStateInfo();

    try {
      await this.lightspeedContainerHelper.ensureLightspeedContainerStarted();
    } catch (error: unknown) {
      this.#state.status = LightspeedState.ERROR;
      this.#state.error = String(error);
      await this.broadcastStateInfo();
      return;
    }

    // Ready
    this.#state.status = LightspeedState.READY;
    this.#state.error = undefined;
    await this.broadcastStateInfo();
  }

  protected async broadcastStateInfo(): Promise<void> {
    await this.rpcExtension.fire(EVENT_LIGHTSPEED_STATE, this.#state);
  }

  dispose(): void {
    this.#state = undefined;
  }
}
