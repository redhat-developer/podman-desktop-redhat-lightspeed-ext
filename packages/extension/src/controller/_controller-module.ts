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

import { ContainerModule } from 'inversify';

import { ChatPrompt } from '/@common/interface/chat-prompt-api';
import { LightspeedApi } from '/@common/interface/lightspeed-api';

import { ChatPromptImpl } from './chat-prompt-impl';
import { Controller } from './controller-api';
import { LightspeedImpl } from './lightspeed-impl';

const controllersModule = new ContainerModule(options => {
  options.bind(LightspeedImpl).toSelf().inSingletonScope();
  options.bind(LightspeedApi).toService(LightspeedImpl);
  options.bind(Controller).toService(LightspeedImpl);

  options.bind(ChatPromptImpl).toSelf().inSingletonScope();
  options.bind(ChatPrompt).toService(ChatPromptImpl);
  options.bind(Controller).toService(ChatPromptImpl);
});

export { controllersModule };
