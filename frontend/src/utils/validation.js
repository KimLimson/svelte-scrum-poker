import { showToast as toast } from './toast.js';

/**
 * Validates user input for joining a room
 * @param {string} name - User's name
 * @param {string} code - Room code
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateJoinRoom(name, code) {
  const cleanName = (name || "").trim();
  const cleanCode = (code || "").trim();
  
  if (!cleanName && !cleanCode) {
    toast({ message: "Enter your name and room code.", type: "error" });
    return false;
  }
  
  if (!cleanName) {
    toast({ message: "Please enter your name.", type: "error" });
    return false;
  }
  
  if (!cleanCode) {
    toast({ message: "Please enter a room code.", type: "error" });
    return false;
  }
  
  return true;
}

/**
 * Validates user input for creating a room
 * @param {string} name - User's name
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateCreateRoom(name) {
  const cleanName = (name || "").trim();
  
  if (!cleanName) {
    toast({ message: "Please enter your name.", type: "error" });
    return false;
  }
  
  return true;
}

/**
 * Validates notes before saving
 * @param {Array} notes - Array of note strings
 * @param {string} vote - Current user vote
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateNotes(notes, vote) {
  if (!vote) {
    toast({
      message: "Please select a vote first before adding notes.",
      type: "error",
    });
    return false;
  }
  
  if (notes.length >= 50) {
    toast({ message: "Too many notes.", type: "error" });
    return false;
  }
  
  return true;
}

/**
 * Cleans and validates notes array
 * @param {Array} notes - Array of note strings
 * @returns {Array} - Cleaned notes array
 */
export function cleanNotes(notes) {
  const cleaned = notes
    .map(note => (note || "").trim())
    .filter(Boolean)
    .slice(0, 50);
  
  return cleaned.length ? cleaned : [""];
}

/**
 * Validates if user can add a new note
 * @param {Array} notes - Current notes array
 * @param {string} vote - Current user vote
 * @returns {boolean} - True if can add, false otherwise
 */
export function canAddNote(notes, vote) {
  if (!vote) {
    toast({
      message: "Please select a vote first before adding notes.",
      type: "error",
    });
    return false;
  }
  
  if (notes.length >= 50) {
    toast({ message: "Too many notes.", type: "error" });
    return false;
  }
  
  return true;
}
