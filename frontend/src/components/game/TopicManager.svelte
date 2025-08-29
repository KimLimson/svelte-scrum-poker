<script>
  import { currentTopic, topicInput, roomCode, userRole } from '../../stores/gameStore.js';
  import { socketService } from '../../services/socketService.js';
  import { ROLES } from '../../utils/constants.js';

  $: code = $roomCode;
  $: topic = $currentTopic;
  $: role = $userRole;

  // Sync input with state topic
  $: if (topic !== undefined) {
    topicInput.set(topic);
  }

  function setTopic() {
    if (!code) return;
    socketService.setTopic(code, $topicInput);
  }

  function clearTopic() {
    if (!code) return;
    topicInput.set("");
    socketService.setTopic(code, "");
  }
</script>

{#if role === ROLES.HOST}
  {#if !topic}
    <div class="hstack mt-2">
      <input
        bind:value={$topicInput}
        placeholder="Story / ticket / topic"
        style="flex:1"
      />
      <button class="small" on:click={setTopic}>Set</button>
    </div>
  {:else}
    <div class="mt-2">
      <div class="muted">Current Topic</div>
      <div class="topic-display">
        <div class="topic-text">{topic}</div>
      </div>
    </div>
  {/if}
{/if}

{#if role === ROLES.PARTICIPANT}
  <div class="mt-2">
    <div class="muted">Current Topic</div>
    <div class="topic-display">
      {#if topic && topic.trim()}
        <div class="topic-text">{topic}</div>
      {:else}
        <div class="muted">No topic set</div>
      {/if}
    </div>
  </div>
{/if}
