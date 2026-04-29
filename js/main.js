import { startListening } from './audio.js';
import { initSky } from './canvas.js';

const overlay = document.getElementById('overlay');
const beginBtn = document.getElementById('beginBtn');
const status = document.getElementById('status');

// Initialize the canvas star field
initSky();

beginBtn.addEventListener('click', async () => {
  try {
    // Fade out the overlay
    overlay.classList.add('hidden');
    
    // Show listening status
    setTimeout(() => {
      status.classList.remove('hidden');
    }, 1500);

    // Start the magic
    await startListening();
  } catch (err) {
    console.error('Mic access denied:', err);
    alert('the universe needs to hear you. please allow microphone access.');
  }
});