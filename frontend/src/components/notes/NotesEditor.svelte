<script>
  import { myNotes, myVote, notesEditing, roomCode } from '../../stores/gameStore.js';
  import { socketService } from '../../services/socketService.js';
  import { canAddNote, cleanNotes, validateNotes } from '../../utils/validation.js';
  import { showToast as toast } from '../../utils/toast.js';

  $: code = $roomCode;

  function addNote() {
    if (!canAddNote($myNotes, $myVote)) return;
    myNotes.update(notes => [...notes, ""]);
  }

  function removeNote(noteIndex) {
    myNotes.update(notes => {
      if (notes.length <= 1) {
        return [""];
      }
      return notes.filter((_, index) => index !== noteIndex);
    });
  }

  function saveNotes() {
    if (!validateNotes($myNotes, $myVote)) return;
    if (!code) return;

    const cleaned = cleanNotes($myNotes);
    myNotes.set(cleaned);
    
    socketService.saveNotes(code, cleaned);
    toast({ message: "Notes saved", type: "success" });
    notesEditing.set(false);
  }

  function editNotes() {
    notesEditing.set(true);
  }
</script>

{#if $notesEditing}
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
          >
            <path d="M4 19.5V5a2 2 0 0 1 2-2h8l6 6v10.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19.5z"></path>
            <path d="M14 3v6h6"></path>
          </svg>
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
          stroke-linejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span class="btn-text">Add</span>
      </button>
    </div>
    <div class="vstack note-list">
      {#each $myNotes as note, noteIndex}
        <div class="hstack" style="gap:.5rem; align-items:center;">
          <input
            style="flex:1"
            bind:value={$myNotes[noteIndex]}
            placeholder={$myVote ? "Add a key note..." : "Select a vote first..."}
            disabled={!$myVote}
          />
          <button
            class="small ghost"
            on:click={() => removeNote(noteIndex)}
          >
            −
          </button>
        </div>
      {/each}
    </div>
    <div class="notes-footer hstack" style="justify-content:flex-end;">
      <button class="small primary save-btn" on:click={saveNotes}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1a1a1a"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
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
      >
        <path d="M4 19.5V5a2 2 0 0 1 2-2h8l6 6v10.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19.5z"></path>
        <path d="M14 3v6h6"></path>
      </svg>
    </span>
    <div class="title" style="margin:0">Key notes</div>
  </div>
  <div class="vstack" style="gap:.5rem;">
    {#each $myNotes.filter((note) => note.trim()) as note}
      <div style="padding: 0.5rem 0;">• {note}</div>
    {/each}
    {#if $myNotes.filter((note) => note.trim()).length === 0}
      <div class="muted">No notes added.</div>
    {/if}
    <div class="hstack mt-2" style="justify-content:flex-end;">
      <button class="btn-text" on:click={editNotes}>Edit</button>
    </div>
  </div>
{/if}
