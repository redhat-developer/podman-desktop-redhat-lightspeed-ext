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

import type { ExtensionContext } from '@podman-desktop/api';

import { LightspeedExtension } from './rhel-lightspeed-extension';

let lightspeedExtension: LightspeedExtension | undefined;

// Initialize the activation of the extension.
export async function activate(extensionContext: ExtensionContext): Promise<void> {
  if (!lightspeedExtension) {
    lightspeedExtension = new LightspeedExtension(extensionContext);
  }

  await lightspeedExtension.activate();
}

export async function deactivate(): Promise<void> {
  await lightspeedExtension?.deactivate();
  lightspeedExtension = undefined;
}

// Expose lightspeedExtension for testing purposes
if (process.env.NODE_ENV === 'test') {
  Object.defineProperty(global, 'lightspeedExtension', {
    get: () => lightspeedExtension,
  });
}
