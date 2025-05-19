<script lang="ts">
import { getContext } from 'svelte';
import { States } from './state/states';
import InitializingEmptyScreen from './component/screen/InitializingEmptyScreen.svelte';
import StartingEmptyScreen from './component/screen/StartingEmptyScreen.svelte';
import ErrorEmptyScreen from './component/screen/ErrorEmptyScreen.svelte';
import Chat from './component/Chat.svelte';
import { Button } from '@podman-desktop/ui-svelte';
import { API_LIGHTSPEED } from '/@common/channels';
import { Remote } from './remote/remote';
import type { LightspeedApi } from '/@common/interface/lightspeed-api';

const remote = getContext<Remote>(Remote);
const lightspeedClient = remote.getProxy<LightspeedApi>(API_LIGHTSPEED);

let restarting = $state(false);

async function restart(): Promise<void> {
  restarting = true;
  await lightspeedClient.restart();
  restarting = false;
}
const stateInfo = getContext<States>(States).stateLightspeedStateInfoUI;
</script>

<main class="flex flex-col w-screen h-screen overflow-hidden bg-[var(--pd-content-bg)]">
  <div class="flex flex-row w-full h-full overflow-hidden items-center justify-center">
    {#if stateInfo.data?.status === 'INITIALIZING'}
      <InitializingEmptyScreen />
    {:else if stateInfo.data?.status === 'STARTING'}
      <StartingEmptyScreen />
    {:else if stateInfo.data?.status === 'ERROR_ENTITLEMENT'}
      <div class="flex flex-col items-center justify-center">
        <p>The container is not part of a subscription.</p>
        <p class="mb-2">
          Ensure podman runs on a system with a subscription. Please log-in using Red Hat authentication and restart.
        </p>
        <Button inProgress={restarting} onclick={restart}>Restart</Button>
        <ErrorEmptyScreen title="Error" errorMessage={stateInfo.data?.error} />
      </div>
    {:else if stateInfo.data?.status === 'ERROR'}
      <ErrorEmptyScreen title="Error" errorMessage={stateInfo.data?.error} />
    {:else if stateInfo.data?.status === 'READY'}
      <Chat />
    {:else}
      <ErrorEmptyScreen title="Error when initializing" errorMessage={stateInfo.data?.error} />
    {/if}
  </div>
</main>
