<script>
  import { io } from "socket.io-client";
  import Toast from "./lib/Toast.svelte";
  import { showToast as toast } from "./lib/toast";
  import PieChart from "./lib/PieChart.svelte";

  const socket = io();

  let name = "";
  let code = "";
  let view = "auth"; // 'auth' | 'app'

  let state = null;
  let deckSelect;
  let myVote = null;
  let role = "none"; // 'none' | 'participant' | 'host'
  let results = [];
  let pieData = [];
  // track reveal transitions to reset local notes client-side on host reset
  let wasRevealed = false;

  function joinRoom() {
    const cleanName = (name || "").trim();
    const cleanCode = (code || "").trim();
    if (!cleanName && !cleanCode) {
      toast({ message: "Enter your name and room code.", type: "error" });
      return;
    }
    if (!cleanName) {
      toast({ message: "Please enter your name.", type: "error" });
      return;
    }
    if (!cleanCode) {
      toast({ message: "Please enter a room code.", type: "error" });
      return;
    }
    socket.emit("joinRoom", { code: cleanCode.toUpperCase(), name: cleanName });
    socket.emit("sync", { code: cleanCode.toUpperCase() });
    view = "app";
  }

  function createRoom() {
    const clean = (name || "").trim();
    if (!clean) {
      toast({ message: "Please enter your name.", type: "error" });
      return;
    }
    socket.emit("createRoom", { name: clean });
  }

  socket.on("roomCreated", ({ code: roomCode }) => {
    code = roomCode;
    history.replaceState({}, "", location.pathname + "?room=" + roomCode);
    view = "app";
    socket.emit("sync", { code: roomCode });
  });

  socket.on("errorMsg", (message) => {
    toast({ message: message, type: "error" });
  });

  socket.on("state", (newState) => {
    state = newState;

    // if a reset happened (revealed transitioned from true -> false),
    // clear local notes and return to edit mode for all clients
    if (wasRevealed && !state?.revealed) {
      myNotes = [""];
      notesEditing = true;
      myVote = null; // Ensure vote is cleared on reset
    }

    const currentUser = (state?.users || []).find(
      (user) => user.id === socket.id
    );
    if (state?.revealed) {
      if (currentUser && currentUser.vote) myVote = currentUser.vote;
    } else {
      // Only update myVote if we haven't just reset it
      if (!wasRevealed || state?.revealed !== false) {
        if (!currentUser || currentUser.vote == null) myVote = null;
      }
    }

    // Prepare results data when revealed
    if (state?.revealed) {
      const counts = new Map();
      (state.users || []).forEach((user) => {
        if (user.vote) counts.set(user.vote, (counts.get(user.vote) || 0) + 1);
      });
      results = Array.from(counts.entries()).map(([label, value]) => ({
        label,
        value,
      }));
      pieData = results.map((result) => ({
        label: result.label,
        value: result.value,
      }));
    }

    wasRevealed = !!state?.revealed;
  });

  let topic = "";
  $: topic = state?.topic || "";

  function setTopic() {
    if (!state) return;
    socket.emit("setTopic", { code: state.code, topic });
  }

  function cast(value) {
    if (!state) return;
    myVote = value;
    socket.emit("cast", { code: state.code, value });
  }

  function clearVote() {
    if (!state) return;
    myVote = null;
    socket.emit("clearVote", { code: state.code });
  }
  // notes state (local editor for me, and viewing other user's notes)
  let myNotes = [""];
  let notesEditing = true; // track if notes are in edit mode

  function addNote() {
    if (!myVote) {
      toast({
        message: "Please select a vote first before adding notes.",
        type: "error",
      });
      return;
    }
    if (myNotes.length >= 50)
      return toast({ message: "Too many notes.", type: "error" });
    myNotes = [...myNotes, ""];
  }
  function removeNote(noteIndex) {
    if (myNotes.length <= 1) {
      myNotes = [""];
      return;
    }
    myNotes = myNotes.filter((_, index) => index !== noteIndex);
  }
  function saveMyNotes() {
    if (!myVote) {
      toast({
        message: "Please select a vote first before adding notes.",
        type: "error",
      });
      return;
    }
    if (!state) return;
    const cleanNotes = myNotes
      .map((note) => (note || "").trim())
      .filter(Boolean)
      .slice(0, 50);
    myNotes = cleanNotes.length ? cleanNotes : [""];
    socket.emit("saveNotes", { code: state.code, notes: cleanNotes });
    toast({ message: "Notes saved", type: "success" });
    notesEditing = false; // switch to read-only mode
  }

  function editNotes() {
    notesEditing = true;
  }

  function applyDeck(deckName) {
    if (!state) return;
    socket.emit("setDeck", { code: state.code, deckName });
  }

  function reveal() {
    if (state) socket.emit("reveal", { code: state.code });
  }

  function reset() {
    if (state) {
      // Clear local notes and vote on reset
      myNotes = [""];
      notesEditing = true;
      myVote = null;
      socket.emit("reset", { code: state.code });
    }
  }

  // deep link
  const qs = new URLSearchParams(location.search);
  const initial = qs.get("room");
  if (initial) {
    code = initial;
    // Ask the user to choose role and enter name (no auto-join)
    view = "auth";
    role = "none";
  }
</script>

<div class="container">
  {#if view === "auth"}
    <div class="header section">
      <h1>🃏 Scrum Poker</h1>
      <div class="subtitle">Warm theme · Sockets powered · No accounts</div>
    </div>

    {#if role === "none"}
      <div class="row section">
        <button
          class="card col"
          on:click={() => (role = "host")}
          style="text-align:left"
        >
          <div class="title">I am a Host</div>
          <p class="muted">Create a new room and facilitate the session.</p>
        </button>
        <button
          class="card col"
          on:click={() => (role = "participant")}
          style="text-align:left"
        >
          <div class="title">I am a Participant</div>
          <p class="muted">Join an existing room to vote.</p>
        </button>
      </div>
    {:else if role === "participant"}
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
    {:else}
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
    {/if}
  {/if}

  {#if view === "app" && state}
    {#if role === "host"}
      <div class="row">
        <div class="card col">
          <div class="title">Facilitator controls</div>
          <div class="grid one">
            <select bind:this={deckSelect}>
              <option value="Fibonacci">Fibonacci</option>
              <option value="T‑Shirt">T‑Shirt</option>
              <option value="0–13">0–13</option>
            </select>
          </div>
          <div class="hstack mt-2">
            <button class="small" on:click={() => applyDeck(deckSelect.value)}
              >Apply deck</button
            >
            <button class="small" on:click={reveal}>Reveal</button>
            <button class="small" on:click={reset}>Reset</button>
          </div>
        </div>
      </div>
    {/if}
    <div class="row">
      <div class="card col-wide">
        <div class="hstack between">
          <div>
            <div class="muted">Room</div>
            <div class="title">{state.code}</div>
          </div>
          <div class="badge">Deck: {state.deckName}</div>
        </div>

        {#if role === "host"}
          <div class="hstack mt-2">
            <input
              bind:value={topic}
              placeholder="Story / ticket / topic"
              style="flex:1"
            />
            <button class="small" on:click={setTopic}>Save</button>
          </div>
        {/if}

        {#if role === "participant"}
          <div class="mt-3">
            <div class="muted">Pick a card</div>
            <div class="cards mt-1">
              {#each state.deck as cardValue}
                <button
                  class="card-btn"
                  class:active={myVote === cardValue}
                  on:click={() => cast(cardValue)}>{cardValue}</button
                >
              {/each}
            </div>
            <div class="hstack mt-2">
              <button class="ghost small" on:click={clearVote}
                >Clear vote</button
              >
            </div>
          </div>
        {/if}
        {#if state.revealed}
          <div class="mt-3">
            <div class="muted">Votes revealed. See results below.</div>
          </div>
        {/if}
      </div>

      <div class="card col">
        <div class="title">Participants</div>
        <div class="grid">
          {#each state.users as user}
            <div class="user">
              <div>
                {user.name}{user.id === state.ownerId ? " (owner)" : ""}
                {#if user.notes && user.notes.length}
                  <span class="badge" style="margin-left:.5rem;">has notes</span
                  >
                {/if}
              </div>
              <div class="vote">{user.vote || ""}</div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    {#if state.revealed}
      <div class="row">
        <div class="card col-wide" style="text-align:center">
          <div class="title">Results</div>
          <div
            style="display:flex; justify-content:center; align-items:center;"
          >
            <PieChart data={pieData} size={520} />
          </div>
        </div>
      </div>

      {#each state.users.filter((user) => user.id !== state.ownerId) as user}
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
    {/if}

    {#if role === "participant" && !state.revealed}
      <div class="row">
        <div class="card col-wide">
          {#if notesEditing}
            <div class="notes-section">
              <div class="notes-header hstack between">
                <div class="hstack" style="gap:.5rem; align-items:center;">
                  <span class="note-icon" aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--text-secondary)"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      ><path
                        d="M4 19.5V5a2 2 0 0 1 2-2h8l6 6v10.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19.5z"
                      ></path><path d="M14 3v6h6"></path></svg
                    >
                  </span>
                  <div class="title" style="margin:0">Key notes</div>
                </div>
                <button
                  class="icon-btn add-btn"
                  on:click={addNote}
                  aria-label="Add note"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg
                  >
                  <span class="btn-text">Add</span>
                </button>
              </div>
              <div class="vstack note-list">
                {#each myNotes as _, noteIndex}
                  <div class="hstack" style="gap:.5rem; align-items:center;">
                    <input
                      style="flex:1"
                      bind:value={myNotes[noteIndex]}
                      placeholder={myVote
                        ? "Add a key note..."
                        : "Select a vote first..."}
                      disabled={!myVote}
                    />
                    <button
                      class="small ghost"
                      on:click={() => removeNote(noteIndex)}>−</button
                    >
                  </div>
                {/each}
              </div>
              <div
                class="notes-footer hstack"
                style="justify-content:flex-end;"
              >
                <button class="small primary save-btn" on:click={saveMyNotes}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1a1a1a"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg
                  >
                  <span>Save notes</span>
                </button>
              </div>
            </div>
          {:else}
            <div class="hstack" style="gap:.5rem; align-items:center;">
              <span class="note-icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-secondary)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><path
                    d="M4 19.5V5a2 2 0 0 1 2-2h8l6 6v10.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19.5z"
                  ></path><path d="M14 3v6h6"></path></svg
                >
              </span>
              <div class="title" style="margin:0">Key notes</div>
            </div>
            <div class="vstack" style="gap:.5rem;">
              {#each myNotes.filter((note) => note.trim()) as note}
                <div style="padding: 0.5rem 0;">• {note}</div>
              {/each}
              {#if myNotes.filter((note) => note.trim()).length === 0}
                <div class="muted">No notes added.</div>
              {/if}
              <div class="hstack mt-2" style="justify-content:flex-end;">
                <button class="btn-text" on:click={editNotes}>Edit</button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
  <Toast position="top-right" />
</div>

<style>
  :root {
    --bg-primary: #03071e;
    --bg-secondary: #370617;
    --bg-tertiary: #6a040f;
    --card-bg: #370617;
    --card-border: #6a040f;
    --text-primary: #feedcd;
    --text-secondary: #fcc969;
    --text-muted: #fdbb92;
    --accent: #f48c06;
    --accent-hover: #faa307;
    --accent-light: #ffba08;
    --danger: #dc2f02;
    --success: #f48c06;
    --warning: #faa307;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    margin: 0;
    font-family:
      Inter,
      system-ui,
      -apple-system,
      Segoe UI,
      Roboto,
      sans-serif;
    background: linear-gradient(
      135deg,
      var(--bg-primary) 0%,
      var(--bg-secondary) 50%,
      var(--bg-tertiary) 100%
    );
    color: var(--text-primary);
    min-height: 100vh;
    line-height: 1.6;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .header h1 {
    font-size: 3rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent-light), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
    text-shadow: 0 4px 8px rgba(244, 140, 6, 0.3);
  }

  .subtitle {
    color: var(--text-muted);
    font-size: 1.1rem;
    font-weight: 400;
  }

  .section {
    margin-bottom: 2.5rem;
  }

  .row {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
  }

  .card {
    background: linear-gradient(135deg, var(--card-bg), rgba(106, 4, 15, 0.8));
    border: 2px solid var(--card-border);
    border-radius: 20px;
    padding: 2rem;
    box-shadow:
      0 12px 40px rgba(3, 7, 30, 0.4),
      0 4px 12px rgba(244, 140, 6, 0.1);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent-light));
    opacity: 0.6;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow:
      0 16px 50px rgba(3, 7, 30, 0.5),
      0 6px 16px rgba(244, 140, 6, 0.15);
  }

  .title {
    font-size: 1.125rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
  }
  .muted {
    color: var(--text-muted);
  }
  .badge {
    font-size: 12px;
    opacity: 0.85;
    color: var(--text-secondary);
  }

  .grid {
    display: grid;
    gap: 1rem;
  }
  .two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hstack {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 0.5rem;
  }
  .card-btn {
    padding: 18px 20px;
    border-radius: 16px;
    background: rgba(250, 163, 7, 0.08);
    border: 1px solid rgba(250, 163, 7, 0.35);
    font-weight: 800;
    min-width: 64px;
    text-align: center;
    color: var(--text-primary);
    transition: all 0.2s ease;
  }
  .card-btn:hover,
  .card-btn.active {
    transform: translateY(-1px);
    border-color: var(--accent);
    box-shadow: 0 6px 16px rgba(244, 140, 6, 0.2);
  }

  .user {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid rgba(250, 163, 7, 0.25);
    border-radius: 12px;
    background: rgba(106, 4, 15, 0.35);
  }
  .user .vote {
    font-weight: 800;
    color: var(--accent-light);
  }

  input,
  select,
  button {
    background: rgba(3, 7, 30, 0.4);
    color: var(--text-primary);
    border: 1px solid rgba(250, 163, 7, 0.25);
    padding: 12px 14px;
    border-radius: 12px;
    outline: none;
  }
  input:focus,
  select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(244, 140, 6, 0.25);
  }
  button {
    cursor: pointer;
    font-weight: 700;
  }
  button.primary {
    background: linear-gradient(135deg, var(--accent), var(--accent-light));
    color: #1a1a1a;
    border: none;
  }
  button.ghost {
    background: transparent;
    border-color: rgba(250, 163, 7, 0.35);
    color: var(--text-secondary);
  }
  button.small {
    padding: 8px 12px;
    font-size: 12px;
    border-radius: 10px;
  }

  input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  /* layout helpers */
  .col {
    flex: 1;
    min-width: 300px;
  }
  .col-wide {
    flex: 2;
    min-width: 360px;
  }
  .between {
    justify-content: space-between;
  }
  .mt-1 {
    margin-top: 0.5rem;
  }
  .mt-2 {
    margin-top: 0.75rem;
  }
  .mt-3 {
    margin-top: 1rem;
  }
  /* Notes section styles */
  .notes-header {
    margin-bottom: 0.75rem;
  }
  .note-icon svg {
    display: block;
  }
  .note-list {
    gap: 0.75rem;
  }
  .note-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .note-input {
    flex: 1;
    padding: 12px 14px;
    border-radius: 12px;
  }
  .notes-footer {
    margin-top: 0.75rem;
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 8px 10px;
    border-radius: 10px;
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid rgba(250, 163, 7, 0.35);
  }
  .icon-btn:hover {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(244, 140, 6, 0.12);
  }
  .icon-btn svg {
    pointer-events: none;
  }
  .icon-btn .btn-text {
    font-size: 12px;
    font-weight: 700;
  }
  .add-btn {
    color: var(--text-secondary);
  }

  .save-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  input:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .note-readonly {
    padding: 0.5rem 0;
  }
</style>
