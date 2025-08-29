<script>
  import { userInfo } from '../../stores/gameStore.js';
  import { socketService } from '../../services/socketService.js';
  import { validateJoinRoom } from '../../utils/validation.js';

  let name = '';
  let code = '';

  // Subscribe to userInfo store to sync with any existing values
  userInfo.subscribe(info => {
    name = info.name;
    code = info.code;
  });

  function joinRoom() {
    if (!validateJoinRoom(name, code)) return;
    
    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    
    // Update store with clean values
    userInfo.set({ name: cleanName, code: cleanCode });
    
    // Join room via socket service
    socketService.joinRoom(cleanCode, cleanName);
  }

  // Update store when inputs change
  $: userInfo.set({ name, code });
</script>

<div class="row section">
  <div class="card col">
    <div class="title">Join a room</div>
    <div class="grid two">
      <input bind:value={name} placeholder="Your name" />
      <input bind:value={code} placeholder="Room code (e.g. ABC12)" />
    </div>
    <div class="hstack mt-2">
      <button class="primary" on:click={joinRoom}>Join</button>
    </div>
  </div>
</div>
