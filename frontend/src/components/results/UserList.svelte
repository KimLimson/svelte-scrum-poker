<script>
  import { currentUsers, gameState } from '../../stores/gameStore.js';

  $: users = $currentUsers;
  $: ownerId = $gameState?.ownerId;
</script>

<div class="card col">
  <div class="title">Participants</div>
  <div class="grid">
    {#each users as user}
      <div class="user">
        <div>
          {user.name}{user.id === ownerId ? " (owner)" : ""}
          {#if user.notes && user.notes.length}
            <span class="badge" style="margin-left:.5rem;">has notes</span>
          {/if}
        </div>
        <div class="vote">{user.vote || ""}</div>
      </div>
    {/each}
  </div>
</div>
