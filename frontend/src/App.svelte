<script>
  import { io } from "socket.io-client";
  import Toast from "./lib/Toast.svelte";
  import { showToast as toast } from "./lib/toast";
  import PieChart from "./lib/PieChart.svelte";
  import GlobalStyles from "./styles/GlobalStyles.svelte";

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
  let topicInput = ""; // Local input value for typing
  $: topic = state?.topic || "";
  $: topicInput = topic; // Sync input with state topic

  function setTopic() {
    if (!state) return;
    socket.emit("setTopic", { code: state.code, topic: topicInput });
  }

  function clearTopic() {
    if (!state) return;
    topicInput = "";
    socket.emit("setTopic", { code: state.code, topic: "" });
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
      topicInput = ""; // Clear topic input on reset
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

<GlobalStyles />

<div class="container">
  {#if view === "auth"}
    <div class="header section">
      <h1>🃏 Scrum Poker</h1>
      <div class="subtitle">
        Lightweight · Built-in svelte and socket.io · No accounts needed
      </div>
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
    <div class="header section">
      <h1 class="app">🃏 Scrum Poker</h1>
    </div>
    {#if role === "host"}
      <div class="row">
        <div class="card col">
          <div class="title">Facilitator controls</div>
          <div class="hstack mt-2">
            <select bind:this={deckSelect} style="flex:1">
              <option value="Fibonacci">Fibonacci</option>
              <option value="T‑Shirt">T‑Shirt</option>
              <option value="0–13">0–13</option>
            </select>
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
          {#if !topic}
            <div class="hstack mt-2">
              <input
                bind:value={topicInput}
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

        {#if role === "participant"}
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
