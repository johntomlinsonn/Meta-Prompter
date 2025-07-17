// Test file to verify loading animation integration
// This file can be used for testing purposes

import { showQuestionsLoading, showPromptLoading } from './content/LoadingAnimation.js';

// Test function to show questions loading
function testQuestionsLoading() {
  const loader = showQuestionsLoading();
  loader.show();
  
  setTimeout(() => {
    loader.updateMessage('Still generating questions...', 'This is taking a bit longer...');
  }, 2000);
  
  setTimeout(() => {
    loader.hide();
  }, 4000);
}

// Test function to show prompt loading
function testPromptLoading() {
  const loader = showPromptLoading();
  loader.show();
  
  setTimeout(() => {
    loader.updateMessage('Almost done...', 'Finalizing your improved prompt...');
  }, 2000);
  
  setTimeout(() => {
    loader.hide();
  }, 4000);
}

// Export for manual testing in console
window.testLoadingAnimations = {
  testQuestionsLoading,
  testPromptLoading
};

console.log('Loading animation tests available:');
console.log('- testLoadingAnimations.testQuestionsLoading()');
console.log('- testLoadingAnimations.testPromptLoading()');
