<script>
  import { roomCode, clearUserData, topicInput } from '../../stores/gameStore.js';
  import { socketService } from '../../services/socketService.js';
  import { DECK_TYPES } from '../../utils/constants.js';

  let deckSelect;
  $: code = $roomCode;

  function applyDeck() {
    if (!code || !deckSelect) return;
    socketService.setDeck(code, deckSelect.value);
  }

  function reveal() {
    if (!code) return;
    socketService.revealVotes(code);
  }

  function reset() {
    if (!code) return;
    // Clear local data
    clearUserData();
    topicInput.set('');
    // Send reset to server
    socketService.resetRoom(code);
  }
</script>

<div class="row">
  <div class="card col">
    <div class="title">Facilitator controls</div>
    <div class="hstack mt-2">
      <select bind:this={deckSelect} style="flex:1">
        <option value={DECK_TYPES.FIBONACCI}>{DECK_TYPES.FIBONACCI}</option>
        <option value={DECK_TYPES.T_SHIRT}>{DECK_TYPES.T_SHIRT}</option>
        <option value={DECK_TYPES.ZERO_TO_THIRTEEN}>{DECK_TYPES.ZERO_TO_THIRTEEN}</option>
      </select>
      <button class="small" on:click={applyDeck}>Apply deck</button>
      <button class="small" on:click={reveal}>Reveal</button>
      <button class="small" on:click={reset}>Reset</button>
    </div>
  </div>
</div>
