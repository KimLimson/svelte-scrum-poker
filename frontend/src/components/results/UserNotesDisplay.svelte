<script>
  import { currentUsers, gameState } from '../../stores/gameStore.js';

  $: users = $currentUsers;
  $: ownerId = $gameState?.ownerId;
  $: nonOwnerUsers = users.filter(user => user.id !== ownerId);
</script>

{#each nonOwnerUsers as user}
  <div class="row">
    <div class="card col-wide">
      <div class="title">
        {user.name}'s key notes why it was pointed {user.vote || "?"}
      </div>
      <div class="vstack" style="gap:0.25rem;">
        {#if user.notes && user.notes.length > 0}
          {#each user.notes as note}
            <div>• {note}</div>
          {/each}
        {:else}
          <div class="muted">• no available notes</div>
        {/if}
      </div>
    </div>
  </div>
{/each}
