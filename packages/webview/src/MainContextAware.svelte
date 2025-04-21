<script lang="ts">
import { setContext } from 'svelte';

import type { MainContext } from './main';
import Lightspeed from './Lightspeed.svelte';
import { Remote } from './remote/remote';
import { States } from './state/states';

interface Props {
  context: MainContext;
}

const { context }: Props = $props();

let initialized = $state(false);

// Sets the value in the global svelte context
setContext(Remote, context.remote);
setContext(States, context.states);

initialized = true;
</script>

{#if initialized}
  <Lightspeed />
{/if}
