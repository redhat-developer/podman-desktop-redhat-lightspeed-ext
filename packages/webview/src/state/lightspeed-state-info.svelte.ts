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

import { inject, injectable } from 'inversify';

import { EVENT_LIGHTSPEED_STATE } from '/@common/channels';
import type { LightspeedStateInfo } from '/@common/model/lightspeed-state-info';
import { RpcBrowser } from '/@common/rpc/rpc';

import { AbsStateObjectImpl, type StateObject } from './util/state-object.svelte';

// Define a state for the StateLightspeedStateInfo
@injectable()
export class StateLightspeedStateInfo
  extends AbsStateObjectImpl<LightspeedStateInfo>
  implements StateObject<LightspeedStateInfo>
{
  constructor(@inject(RpcBrowser) rpcBrowser: RpcBrowser) {
    super(rpcBrowser);
  }

  async init(): Promise<void> {
    await this.initChannel(EVENT_LIGHTSPEED_STATE);
  }
}
