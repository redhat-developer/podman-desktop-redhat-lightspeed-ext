<script lang="ts">
// App.css includes tailwind css dependencies that we use
import './app.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import { onDestroy, onMount } from 'svelte';

import { Main, type MainContext } from './main';
import MainContextAware from './MainContextAware.svelte';

let main: Main | undefined;
let mainContext: MainContext | undefined = $state();

onMount(async () => {
  // Perform initalization
  main = new Main();
 const now = performance.now();
  mainContext = await main.init();
  console.log(`Initialization took ${performance.now() - now}ms`);
});

onDestroy(() => {
  // Dispose
  main?.dispose();
});
</script>

{#if mainContext}
  <MainContextAware context={mainContext} />
{/if}
