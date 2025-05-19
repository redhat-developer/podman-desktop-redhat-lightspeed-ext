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

import { inject } from 'inversify';

import { API_LIGHTSPEED } from '/@common/channels';
import { LightspeedApi } from '/@common/interface/lightspeed-api';
import { RpcChannel } from '/@common/rpc';

import { StateManager } from '../manager/state-manager';
import { Controller } from './controller-api';

export class LightspeedImpl implements LightspeedApi, Controller<LightspeedApi> {
  @inject(StateManager)
  stateManager: StateManager;

  getChannel(): RpcChannel<LightspeedApi> {
    return API_LIGHTSPEED;
  }

  async initStates(): Promise<void> {
    await this.stateManager.initStates();
  }

  async check(): Promise<void> {
    await this.stateManager.check();
  }

  async restart(): Promise<void> {
    await this.stateManager.restartContainer();
  }
}
