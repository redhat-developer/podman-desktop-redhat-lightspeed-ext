<script lang="ts">
import { EmptyScreen } from '@podman-desktop/ui-svelte';

import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

interface Props {
  title: string;
  errorMessage?: string;
}

let { title, errorMessage }: Props = $props();
</script>

<EmptyScreen icon={faExclamationCircle} title={title} message={errorMessage} />
