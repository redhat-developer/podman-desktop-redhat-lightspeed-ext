<script lang="ts">
import { getContext } from 'svelte';
import { States } from './state/states';
import InitializingEmptyScreen from './component/screen/InitializingEmptyScreen.svelte';
import StartingEmptyScreen from './component/screen/StartingEmptyScreen.svelte';
import ErrorEmptyScreen from './component/screen/ErrorEmptyScreen.svelte';
import Chat from './component/Chat.svelte';

const stateInfo = getContext<States>(States).stateLightspeedStateInfoUI;
</script>

<main class="flex flex-col w-screen h-screen overflow-hidden bg-[var(--pd-content-bg)]">
  <div class="flex flex-row w-full h-full overflow-hidden items-center justify-center">
    {#if stateInfo.data?.status === 'INITIALIZING'}
      <InitializingEmptyScreen />
    {:else if stateInfo.data?.status === 'STARTING'}
      <StartingEmptyScreen />
    {:else if stateInfo.data?.status === 'ERROR'}
      <ErrorEmptyScreen title="Error" errorMessage={stateInfo.data?.error} />
    {:else if stateInfo.data?.status === 'READY'}
      <Chat />
    {:else}
      <ErrorEmptyScreen title="Error when initializing" errorMessage={stateInfo.data?.error} />
    {/if}
  </div>
</main>
