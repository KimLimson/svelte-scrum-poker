// Application views
export const VIEWS = {
  AUTH: 'auth',
  APP: 'app'
};

// User roles
export const ROLES = {
  NONE: 'none',
  PARTICIPANT: 'participant',
  HOST: 'host'
};

// Available deck types
export const DECK_TYPES = {
  FIBONACCI: 'Fibonacci',
  T_SHIRT: 'T‑Shirt',
  ZERO_TO_THIRTEEN: '0–13'
};

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

// Maximum limits
export const LIMITS = {
  MAX_NOTES: 50,
  MAX_NAME_LENGTH: 100,
  MAX_TOPIC_LENGTH: 500
};

// Socket events
export const SOCKET_EVENTS = {
  // Outgoing
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  SYNC: 'sync',
  SET_TOPIC: 'setTopic',
  CAST: 'cast',
  CLEAR_VOTE: 'clearVote',
  SAVE_NOTES: 'saveNotes',
  SET_DECK: 'setDeck',
  REVEAL: 'reveal',
  RESET: 'reset',
  
  // Incoming
  ROOM_CREATED: 'roomCreated',
  ERROR_MSG: 'errorMsg',
  STATE: 'state',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect'
};

// Default values
export const DEFAULTS = {
  EMPTY_NOTE: '',
  INITIAL_NOTES: [''],
  DECK_SELECT_DEFAULT: DECK_TYPES.FIBONACCI
};
