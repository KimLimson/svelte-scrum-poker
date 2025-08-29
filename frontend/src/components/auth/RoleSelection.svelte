<script>
  import { userRole } from '../../stores/gameStore.js';
  import { ROLES } from '../../utils/constants.js';

  function selectRole(role) {
    userRole.set(role);
  }
</script>

<div class="row section">
  <button
    class="card col"
    on:click={() => selectRole(ROLES.HOST)}
    style="text-align:left"
  >
    <div class="title">I am a Host</div>
    <p class="muted">Create a new room and facilitate the session.</p>
  </button>
  <button
    class="card col"
    on:click={() => selectRole(ROLES.PARTICIPANT)}
    style="text-align:left"
  >
    <div class="title">I am a Participant</div>
    <p class="muted">Join an existing room to vote.</p>
  </button>
</div>
