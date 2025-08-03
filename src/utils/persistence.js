/**
 * Utility functions for persisting XState machine state to localStorage
 */

const STORAGE_KEY = 'xstate-demo-state';

/**
 * Save state to localStorage
 * @param {object} state - The XState state object
 * @param {object} context - The machine context
 */
export const saveStateToStorage = (state, context) => {
  try {
    const stateData = {
      value: state.value,
      context: context,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateData));
    console.log('State saved to localStorage:', stateData);
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

/**
 * Load state from localStorage
 * @returns {object|null} The saved state data or null if not found
 */
export const loadStateFromStorage = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log('State loaded from localStorage:', parsedData);
      return parsedData;
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
  }
  return null;
};

/**
 * Clear saved state from localStorage
 */
export const clearSavedState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Saved state cleared from localStorage');
  } catch (error) {
    console.error('Failed to clear saved state:', error);
  }
};

/**
 * Check if there's a saved state in localStorage
 * @returns {boolean} True if saved state exists
 */
export const hasSavedState = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    console.error('Failed to check for saved state:', error);
    return false;
  }
};
