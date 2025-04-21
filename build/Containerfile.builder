#
# Copyright (C) 2025 Red Hat, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:9.5-1741873206
# change home directory to be at /opt/app-root
ENV HOME=/opt/app-root

# copy the application files to the /opt/app-root/extension-source directory
WORKDIR /opt/app-root/extension-source
RUN mkdir -p /opt/app-root/extension-source
COPY --chown=1001:root .npmrc /opt/app-root/extension-source/
COPY --chown=1001:root package.json /opt/app-root/extension-source/
COPY --chown=1001:root pnpm-lock.yaml /opt/app-root/extension-source/
COPY --chown=1001:root pnpm-workspace.yaml /opt/app-root/extension-source/
COPY --chown=1001:root packages/webview/package.json /opt/app-root/extension-source/packages/webview/package.json
COPY --chown=1001:root packages/extension/package.json /opt/app-root/extension-source/packages/extension/package.json

RUN npm install --global pnpm@10 && \
    pnpm --frozen-lockfile install