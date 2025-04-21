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

import type { WebviewPanel, ExtensionContext } from '@podman-desktop/api';
import { Uri, window } from '@podman-desktop/api';
import { beforeEach, expect, test, vi } from 'vitest';
import type { Container, ServiceIdentifier } from 'inversify';
import { LightspeedExtension } from './rhel-lightspeed-extension';

import { InversifyBinding } from './inject/inversify-binding';
import { StateManager } from './manager/state-manager';
import { readFile } from 'node:fs/promises';

let extensionContextMock: ExtensionContext;
let lightspeedExtension: TestLightspeedExtension;

vi.mock(import('./manager/state-manager'));
vi.mock(import('node:fs'));
vi.mock(import('node:fs/promises'));

class TestLightspeedExtension extends LightspeedExtension {
  public getContainer(): Container | undefined {
    return super.getContainer();
  }
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();

  vi.mocked(window.createWebviewPanel).mockReturnValue({
    webview: {
      html: '',
      onDidReceiveMessage: vi.fn(),
    },
  } as unknown as WebviewPanel);
  vi.mocked(Uri.joinPath).mockReturnValue({ fsPath: '' } as unknown as Uri);
  vi.mocked(readFile).mockResolvedValue('<html></html>');
  // Create a mock for the ExtensionContext
  extensionContextMock = {
    subscriptions: [],
  } as unknown as ExtensionContext;
  lightspeedExtension = new TestLightspeedExtension(extensionContextMock);
});

test('should activate correctly', async () => {
  expect.assertions(1);

  await lightspeedExtension.activate();

  expect(lightspeedExtension.getContainer()?.get(StateManager)).toBeInstanceOf(StateManager);
});

test('should deactivate correctly', async () => {
  expect.assertions(2);

  await lightspeedExtension.activate();

  expect(lightspeedExtension.getContainer()?.isBound(StateManager)).toBe(true);

  await lightspeedExtension.deactivate();

  // Check the bindings are gone
  expect(lightspeedExtension.getContainer()?.isBound(StateManager)).toBe(false);
});

test('should log error if getAsync for StateManager throws', async () => {
  expect.assertions(2);

  const error = new Error('getAsync failure');
  const spyConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  // Mock the initBindings to return a container with a throwing getAsync
  const fakeContainer = {
    getAllAsync: vi.fn<(serviceIdentifier: ServiceIdentifier) => Promise<unknown>>().mockResolvedValue(''),
    getAsync: vi.fn<(serviceIdentifier: ServiceIdentifier) => Promise<unknown>>().mockRejectedValueOnce(error),
  } as unknown as Container;
  const initBindingsMock = vi.fn<() => Promise<Container>>().mockResolvedValue(fakeContainer);
  const spyInitBindings = vi.spyOn(InversifyBinding.prototype, 'initBindings');
  spyInitBindings.mockImplementation(initBindingsMock);

  await expect(lightspeedExtension.activate()).rejects.toThrowError(error);

  expect(fakeContainer.getAsync).toHaveBeenCalledWith(StateManager);

  spyConsoleError.mockRestore();
});
