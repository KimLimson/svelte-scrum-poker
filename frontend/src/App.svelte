<script>
  import { onMount } from 'svelte';

  // Components
  import Toast from "./components/ui/Toast.svelte";
  import GlobalStyles from "./styles/GlobalStyles.svelte";
  import RoleSelection from "./components/auth/RoleSelection.svelte";
  import JoinRoom from "./components/auth/JoinRoom.svelte";
  import CreateRoom from "./components/auth/CreateRoom.svelte";
  import HostControls from "./components/host/HostControls.svelte";
  import GameInfo from "./components/game/GameInfo.svelte";
  import VotingCards from "./components/voting/VotingCards.svelte";
  import NotesEditor from "./components/notes/NotesEditor.svelte";
  import UserList from "./components/results/UserList.svelte";
  import ResultsDisplay from "./components/results/ResultsDisplay.svelte";
  import UserNotesDisplay from "./components/results/UserNotesDisplay.svelte";

  // Stores and services
  import {
    currentView,
    userRole,
    userInfo,
    gameState,
    isRevealed
  } from './stores/gameStore.js';
  import { socketService } from './services/socketService.js';
  import { VIEWS, ROLES } from './utils/constants.js';

  // Initialize socket connection
  onMount(() => {
    socketService.connect();

    // Handle deep linking
    const qs = new URLSearchParams(location.search);
    const initial = qs.get("room");
    if (initial) {
      userInfo.update(info => ({ ...info, code: initial }));
      currentView.set(VIEWS.AUTH);
      userRole.set(ROLES.NONE);
    }
  });
</script>

<GlobalStyles />

<div class="container">
  {#if $currentView === VIEWS.AUTH}
    <div class="header section">
      <h1>🃏 Scrum Poker</h1>
      <div class="subtitle">
        Lightweight · Built-in svelte and socket.io · No accounts needed
      </div>
    </div>

    {#if $userRole === ROLES.NONE}
      <RoleSelection />
    {:else if $userRole === ROLES.PARTICIPANT}
      <JoinRoom />
    {:else}
      <CreateRoom />
    {/if}
  {/if}

  {#if $currentView === VIEWS.APP && $gameState}
    <div class="header section">
      <h1 class="app">🃏 Scrum Poker</h1>
    </div>

    {#if $userRole === ROLES.HOST}
      <HostControls />
    {/if}

    <div class="row">
      <GameInfo />
      <UserList />
    </div>

    {#if $userRole === ROLES.PARTICIPANT}
      <div class="row">
        <div class="card col-wide">
          <VotingCards />
        </div>
      </div>
    {/if}

    {#if $isRevealed}
      <ResultsDisplay />
      <UserNotesDisplay />
    {/if}

    {#if $userRole === ROLES.PARTICIPANT && !$isRevealed}
      <div class="row">
        <div class="card col-wide">
          <NotesEditor />
        </div>
      </div>
    {/if}
  {/if}
  <Toast position="top-right" />
</div>
