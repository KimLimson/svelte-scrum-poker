import { io } from "socket.io-client";
import { updateGameState, currentView, userRole } from '../stores/gameStore.js';
import { showToast as toast } from '../utils/toast.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket) return this.socket;
    
    this.socket = io();
    this.setupEventListeners();
    this.isConnected = true;
    
    // Store socket ID globally for store access
    window.socketId = this.socket.id;
    
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Room creation success
    this.socket.on("roomCreated", ({ code: roomCode }) => {
      // Update URL without page reload
      history.replaceState({}, "", location.pathname + "?room=" + roomCode);
      currentView.set("app");
      this.syncRoom(roomCode);
    });

    // Error messages
    this.socket.on("errorMsg", (message) => {
      toast({ message: message, type: "error" });
    });

    // Game state updates
    this.socket.on("state", (newState) => {
      updateGameState(newState);
    });

    // Connection events
    this.socket.on("connect", () => {
      this.isConnected = true;
      window.socketId = this.socket.id;
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
    });
  }

  // Room management
  createRoom(name) {
    if (!this.socket || !name?.trim()) return;
    this.socket.emit("createRoom", { name: name.trim() });
  }

  joinRoom(code, name) {
    if (!this.socket || !code?.trim() || !name?.trim()) return;
    const cleanCode = code.trim().toUpperCase();
    this.socket.emit("joinRoom", { code: cleanCode, name: name.trim() });
    this.syncRoom(cleanCode);
    currentView.set("app");
  }

  syncRoom(code) {
    if (!this.socket || !code) return;
    this.socket.emit("sync", { code: code.toUpperCase() });
  }

  // Topic management
  setTopic(code, topic) {
    if (!this.socket || !code) return;
    this.socket.emit("setTopic", { code, topic: topic || "" });
  }

  // Voting
  castVote(code, value) {
    if (!this.socket || !code) return;
    this.socket.emit("cast", { code, value });
  }

  clearVote(code) {
    if (!this.socket || !code) return;
    this.socket.emit("clearVote", { code });
  }

  // Notes
  saveNotes(code, notes) {
    if (!this.socket || !code) return;
    const cleanNotes = notes
      .map(note => (note || "").trim())
      .filter(Boolean)
      .slice(0, 50);
    this.socket.emit("saveNotes", { code, notes: cleanNotes });
  }

  // Host controls
  setDeck(code, deckName) {
    if (!this.socket || !code) return;
    this.socket.emit("setDeck", { code, deckName });
  }

  revealVotes(code) {
    if (!this.socket || !code) return;
    this.socket.emit("reveal", { code });
  }

  resetRoom(code) {
    if (!this.socket || !code) return;
    this.socket.emit("reset", { code });
  }

  // Utility
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocketId() {
    return this.socket?.id;
  }
}

// Create singleton instance
export const socketService = new SocketService();
