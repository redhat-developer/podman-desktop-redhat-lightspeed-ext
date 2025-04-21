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

import { env, Uri, window, type ExtensionContext } from '@podman-desktop/api';

import { RpcExtension } from '/@common/rpc/rpc';

import { Controller } from './controller/controller-api';
import { InversifyBinding } from './inject/inversify-binding';
import { StateManager } from './manager/state-manager';
import type { Container } from 'inversify';
import { readFile } from 'node:fs/promises';

export class LightspeedExtension {
  #container: Container | undefined;

  #extensionContext: ExtensionContext;

  #inversifyBinding: InversifyBinding | undefined;

  constructor(readonly extensionContext: ExtensionContext) {
    this.#extensionContext = extensionContext;
  }

  async activate(): Promise<void> {
    const telemetryLogger = env.createTelemetryLogger();

    const panel = window.createWebviewPanel('lightspeed', 'RHEL Lightspeed', {
      localResourceRoots: [Uri.joinPath(this.#extensionContext.extensionUri, 'media')],
    });
    this.#extensionContext.subscriptions.push(panel);

    // Set the index.html file for the webview.
    const indexHtmlUri = Uri.joinPath(this.#extensionContext.extensionUri, 'media', 'index.html');
    const indexHtmlPath = indexHtmlUri.fsPath;

    let indexHtml = await readFile(indexHtmlPath, 'utf8');

    const scriptLink = indexHtml.match(/<script[^>]{0,50}src="([^"]+)"[^>]{0,50}>/g);
    if (scriptLink) {
      scriptLink.forEach(link => {
        const src = /src="(.*?)"/.exec(link);
        if (src) {
          const webviewSrc = panel.webview.asWebviewUri(
            Uri.joinPath(this.#extensionContext.extensionUri, 'media', src[1]),
          );
          indexHtml = indexHtml.replace(src[1], webviewSrc.toString());
        }
      });
    }

    const cssLink = indexHtml.match(/<link[^>]{0,50}href="([^"]+)"[^>]{0,50}>/g);
    if (cssLink) {
      cssLink.forEach(link => {
        const href = /href="(.*?)"/.exec(link);
        if (href) {
          const webviewHref = panel.webview.asWebviewUri(
            Uri.joinPath(this.#extensionContext.extensionUri, 'media', href[1]),
          );
          indexHtml = indexHtml.replace(href[1], webviewHref.toString());
        }
      });
    }

    // Update the webview panel with the new index.html file with corrected links.
    panel.webview.html = indexHtml;

    // Register webview communication for this webview
    const rpcExtension = new RpcExtension(panel.webview);
    rpcExtension.init();
    this.#extensionContext.subscriptions.push(rpcExtension);

    const now = performance.now();
    this.#inversifyBinding = new InversifyBinding(rpcExtension, this.extensionContext, telemetryLogger);
    this.#container = await this.#inversifyBinding.initBindings();

    const stateManager = await this.#container.getAsync(StateManager);
    const afterFirst = performance.now();

    console.log('activation time:', afterFirst - now);

    this.#extensionContext.subscriptions.push(stateManager);

    // Register all controllers
    const controllers = await this.#container.getAllAsync<Controller<unknown>>(Controller);
    for (const controller of controllers) {
      rpcExtension.registerInstance(controller.getChannel(), controller);
    }
  }

  protected getContainer(): Container | undefined {
    return this.#container;
  }

  async deactivate(): Promise<void> {
    console.log('deactivating Lightspeed extension');
    await this.#inversifyBinding?.dispose();
  }
}
