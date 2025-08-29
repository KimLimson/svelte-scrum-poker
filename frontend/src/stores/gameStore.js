import { writable, derived } from 'svelte/store';

// Game state store
export const gameState = writable(null);

// User's current vote
export const myVote = writable(null);

// Current view ('auth' | 'app')
export const currentView = writable('auth');

// User role ('none' | 'participant' | 'host')
export const userRole = writable('none');

// User information
export const userInfo = writable({
  name: '',
  code: ''
});

// Topic management
export const topicInput = writable('');

// Notes management
export const myNotes = writable(['']);
export const notesEditing = writable(true);

// Track reveal transitions for reset handling
export const wasRevealed = writable(false);

// Derived stores
export const currentTopic = derived(gameState, ($gameState) => $gameState?.topic || '');

export const isRevealed = derived(gameState, ($gameState) => !!$gameState?.revealed);

export const currentUsers = derived(gameState, ($gameState) => $gameState?.users || []);

export const currentDeck = derived(gameState, ($gameState) => $gameState?.deck || []);

export const deckName = derived(gameState, ($gameState) => $gameState?.deckName || '');

export const roomCode = derived(gameState, ($gameState) => $gameState?.code || '');

export const isHost = derived(
  [gameState, userRole], 
  ([$gameState, $userRole]) => $userRole === 'host' && $gameState?.ownerId
);

export const currentUser = derived(
  [gameState], 
  ([$gameState]) => {
    if (!$gameState?.users) return null;
    // Note: socket.id would need to be passed from the component
    return $gameState.users.find(user => user.id === window.socketId);
  }
);

// Results data for visualization
export const votingResults = derived(
  [gameState, isRevealed],
  ([$gameState, $isRevealed]) => {
    if (!$isRevealed || !$gameState?.users) return [];
    
    const counts = new Map();
    $gameState.users.forEach(user => {
      if (user.vote) {
        counts.set(user.vote, (counts.get(user.vote) || 0) + 1);
      }
    });
    
    return Array.from(counts.entries()).map(([label, value]) => ({
      label,
      value
    }));
  }
);

export const pieChartData = derived(
  votingResults,
  ($votingResults) => $votingResults.map(result => ({
    label: result.label,
    value: result.value
  }))
);

// Helper functions for store updates
export const updateGameState = (newState) => {
  gameState.update(currentState => {
    // Handle reset logic
    if (currentState?.revealed && !newState?.revealed) {
      myNotes.set(['']);
      notesEditing.set(true);
      myVote.set(null);
    }
    
    wasRevealed.set(!!newState?.revealed);
    return newState;
  });
};

export const clearUserData = () => {
  myVote.set(null);
  myNotes.set(['']);
  notesEditing.set(true);
  topicInput.set('');
};

export const resetToAuth = () => {
  currentView.set('auth');
  userRole.set('none');
  gameState.set(null);
  clearUserData();
};
