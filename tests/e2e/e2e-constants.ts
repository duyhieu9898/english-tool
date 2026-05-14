/**
 * Semantic Selectors for E2E Testing
 * Using data-testid ensures tests remain stable even if UI copy or styling changes.
 */
export const E2E_SELECTORS = {
  // Navigation
  QUICK_NAV_VOCAB: 'e2e-quick-nav-vocab',
  LEVEL_A1: 'e2e-level-a1',
  START_PLAY_BTN: 'e2e-start-play-btn',

  // Vocab Module
  VOCAB: {
    FLASHCARD: 'e2e-vocab-flashcard',
    CONTINUE_BTN: 'e2e-vocab-continue-btn',
    REMEMBERED_BTN: 'e2e-vocab-remembered-btn',
  },

  // Review Module
  REVIEW: {
    INPUT: 'e2e-review-input',
    BADGE: 'e2e-review-badge',
  },

  // Listening Module
  LISTENING: {
    INPUT: 'e2e-listening-input',
    CHECK_BTN: 'e2e-listening-check-btn',
    WORD_BADGE: 'e2e-listening-word-badge',
    CONTINUE_BTN: 'e2e-continue-btn',
  },

  // Semantic UI Elements
  PROGRESS_LABEL: 'e2e-progress-label',
  COMPLETION_TITLE: 'e2e-completion-title',
  ERROR_CONTAINER: 'e2e-error-container',
  FEEDBACK_STATUS: 'e2e-feedback-status',
  FEEDBACK_ACTION_BTN: 'e2e-feedback-action-btn',
  RETURN_HOME_BTN: 'e2e-return-home-btn',
};
