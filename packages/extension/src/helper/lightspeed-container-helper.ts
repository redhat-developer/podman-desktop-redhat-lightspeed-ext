import {
  containerEngine,
  ContainerInfo,
  extensions,
  HostConfig,
  ListImagesOptions,
  provider,
  ProviderContainerConnection,
  PullEvent,
  RunOptions,
  RunResult,
} from '@podman-desktop/api';
import { injectable } from 'inversify';

interface PodmanRunOptions extends RunOptions {
  connection?: ProviderContainerConnection;
}
@injectable()
export class LightspeedContainerHelper {
  static readonly IMAGE_NAME = 'quay.io/vrothberg/command-line-assistant:41';
  static readonly CONTAINER_NAME = 'rhel-lightspeed-podman-desktop';

  protected async getLightspeedContainer(): Promise<ContainerInfo | undefined> {
    // Check if the container already exists
    const containerList = await containerEngine.listContainers();

    const containerNameWithSlash = `/${LightspeedContainerHelper.CONTAINER_NAME}`;
    const matchingContainers = containerList.filter(c => c.Names.includes(containerNameWithSlash));

    // If the container already exists, we can start it
    if (matchingContainers.length > 0) {
      const container = matchingContainers[0];
      if (container.State === 'running') {
        return container;
      }
      // If the container is not running, we can start it
      await containerEngine.startContainer(container.engineId, container.Id);
      return container;
    }
  }

  protected getRunningPodmanEngines(): ProviderContainerConnection[] {
    // Get the first engineId
    const engines = provider.getContainerConnections();

    const podmanEngines = engines.filter(providerConnection => providerConnection.connection.type === 'podman');

    /// keep only running engines
    return podmanEngines.filter(providerConnection => providerConnection.connection.status() === 'started');
  }

  protected getFirstRunningPodmanEngine(): ProviderContainerConnection {
    const startedEngines = this.getRunningPodmanEngines();

    if (startedEngines.length === 0) {
      throw new Error('No started podman engine found');
    }
    return startedEngines[0];
  }

  async ensureLightspeedContainerStarted(): Promise<void> {
    const container = await this.getLightspeedContainer();
    // Container already exists and is running
    if (container) {
      return;
    }

    const firstRunningConnection = this.getFirstRunningPodmanEngine()?.connection;

    // Pull the image
    let imageInfo = (
      await containerEngine.listImages({
        provider: firstRunningConnection,
      } as ListImagesOptions)
    ).find(imageInfo => imageInfo.RepoTags?.some(tag => tag === LightspeedContainerHelper.IMAGE_NAME));

    if (!imageInfo) {
      try {
        // Pull image
        await containerEngine.pullImage(
          firstRunningConnection,
          LightspeedContainerHelper.IMAGE_NAME,
          (_event: PullEvent) => {},
        );
        // Get image inspect
        imageInfo = (
          await containerEngine.listImages({
            provider: firstRunningConnection,
          } as ListImagesOptions)
        ).find(imageInfo => imageInfo.RepoTags?.some(tag => tag === LightspeedContainerHelper.IMAGE_NAME));
      } catch (err: unknown) {
        console.warn('Something went wrong while trying to get image inspect', err);
        throw err;
      }
    }

    if (!imageInfo) {
      throw new Error('Image not found');
    }

    // If the container does not exist, we can create it
    const hostConfig: HostConfig = {
      Mounts: [
        {
          Target: '/etc/pki/consumer',
          Source: '/etc/pki/consumer',
          Type: 'bind',
          Mode: 'Z',
        },
      ],
      Privileged: true,
      AutoRemove: true,
    };

    await containerEngine.createContainer(imageInfo.engineId, {
      Image: LightspeedContainerHelper.IMAGE_NAME,
      name: LightspeedContainerHelper.CONTAINER_NAME,
      HostConfig: hostConfig,
    });
  }

  async invokeLightspeedContainer(prompt: string): Promise<RunResult> {
    //
    const container = await this.getLightspeedContainer();
    if (!container) {
      throw new Error('Lightspeed container not found');
    }

    const podmanConnection = this.getFirstRunningPodmanEngine();

    return this.execute(podmanConnection, ['exec', container.Id, '/usr/bin/c', 'chat', '--raw', prompt]);
  }

  /**
   * Execute the podman cli with the arguments provided
   *
   * @example
   * ```
   * const result = await podman.execute(connection, ['machine', 'ls', '--format=json']);
   * ```
   * @param connection
   * @param args
   * @param options
   */
  protected execute(connection: ProviderContainerConnection, args: string[], options?: RunOptions): Promise<RunResult> {
    const podman = extensions.getExtension('podman-desktop.podman');
    if (!podman) {
      throw new Error('Podman extension not found');
    }

    const podmanApi: {
      exec(args: string[], options?: PodmanRunOptions): Promise<RunResult>;
    } = podman.exports;

    return podmanApi.exec(args, {
      ...options,
      connection,
    });
  }
}
