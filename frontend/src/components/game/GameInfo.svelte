<script>
  import { roomCode, deckName, isRevealed } from '../../stores/gameStore.js';
  import TopicManager from './TopicManager.svelte';

  $: code = $roomCode;
  $: deck = $deckName;
  $: revealed = $isRevealed;
</script>

<div class="row">
  <div class="card col-wide">
    <div class="hstack between">
      <div>
        <div class="muted">Room</div>
        <div class="title">{code}</div>
      </div>
      <div class="badge">Deck: {deck}</div>
    </div>

    <TopicManager />

    {#if revealed}
      <div class="mt-3">
        <div class="muted">Votes revealed. See results below.</div>
      </div>
    {/if}
  </div>
</div>
