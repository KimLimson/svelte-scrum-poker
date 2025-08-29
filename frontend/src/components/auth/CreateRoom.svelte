<script>
  import { userInfo } from '../../stores/gameStore.js';
  import { socketService } from '../../services/socketService.js';
  import { validateCreateRoom } from '../../utils/validation.js';

  let name = '';

  // Subscribe to userInfo store to sync with any existing values
  userInfo.subscribe(info => {
    name = info.name;
  });

  function createRoom() {
    if (!validateCreateRoom(name)) return;
    
    const cleanName = name.trim();
    
    // Update store with clean values
    userInfo.update(info => ({ ...info, name: cleanName }));
    
    // Create room via socket service
    socketService.createRoom(cleanName);
  }

  // Update store when input changes
  $: userInfo.update(info => ({ ...info, name }));
</script>

<div class="row section">
  <div class="card col">
    <div class="title">Create a new room</div>
    <div class="grid one">
      <input bind:value={name} placeholder="Your name" />
    </div>
    <div class="hstack mt-2">
      <button class="primary" on:click={createRoom}>Create room</button>
    </div>
  </div>
</div>
