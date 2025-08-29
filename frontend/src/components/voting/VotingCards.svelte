<script>
  import { gameState, myVote, roomCode } from '../../stores/gameStore.js';
  import { socketService } from '../../services/socketService.js';

  $: deck = $gameState?.deck || [];
  $: code = $roomCode;

  function castVote(value) {
    if (!code) return;
    myVote.set(value);
    socketService.castVote(code, value);
  }

  function clearVote() {
    if (!code) return;
    myVote.set(null);
    socketService.clearVote(code);
  }
</script>

<div class="mt-3">
  <div class="muted">Pick a card</div>
  <div class="cards mt-1">
    {#each deck as cardValue}
      <button
        class="card-btn"
        class:active={$myVote === cardValue}
        on:click={() => castVote(cardValue)}
      >
        {cardValue}
      </button>
    {/each}
  </div>
  <div class="hstack mt-2">
    <button class="ghost small" on:click={clearVote}>
      Clear vote
    </button>
  </div>
</div>
