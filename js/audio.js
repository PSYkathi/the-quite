import { addStar } from './canvas.js';

export async function startListening() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true
      } 
    });
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.4;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    
    let lastStarTime = 0;
    let lastStar = null;
    let energyHistory = [];

    function listen() {
      analyser.getByteFrequencyData(data);

      // Overall volume
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      
      // Track energy over time (to detect "moments")
      energyHistory.push(avg);
      if (energyHistory.length > 30) energyHistory.shift();
      
      // Voice "brightness" = how much high-frequency content
      const lowEnergy = data.slice(0, data.length / 3).reduce((a, b) => a + b, 0);
      const midEnergy = data.slice(data.length / 3, (data.length / 3) * 2).reduce((a, b) => a + b, 0);
      const highEnergy = data.slice((data.length / 3) * 2).reduce((a, b) => a + b, 0);
      const totalEnergy = lowEnergy + midEnergy + highEnergy;
      
      const brightness = totalEnergy > 0 ? highEnergy / totalEnergy : 0;
      const warmth = totalEnergy > 0 ? lowEnergy / totalEnergy : 0;

      const now = Date.now();
      
      // Birth a star when there's voice activity
      if (avg > 4 && now - lastStarTime > 150) {
        let x, y;
        
        if (lastStar) {
          // Place near last star (creating a constellation flow)
          const angle = Math.random() * Math.PI * 2;
          const distance = 60 + Math.random() * 180;
          x = lastStar.x + Math.cos(angle) * distance;
          y = lastStar.y + Math.sin(angle) * distance;
          
          // If too close to edge, wrap to other side
          if (x < 50 || x > window.innerWidth - 50 || 
              y < 50 || y > window.innerHeight - 50) {
            x = window.innerWidth * 0.2 + Math.random() * window.innerWidth * 0.6;
            y = window.innerHeight * 0.2 + Math.random() * window.innerHeight * 0.6;
          }
        } else {
          // First star: place in center area
          x = window.innerWidth * 0.3 + Math.random() * window.innerWidth * 0.4;
          y = window.innerHeight * 0.3 + Math.random() * window.innerHeight * 0.4;
        }

        // Color based on voice texture
        let color;
        if (brightness > 0.4) {
          color = '220, 180, 255'; // lavender (bright/airy voice)
        } else if (warmth > 0.5) {
          color = '255, 220, 180'; // gold (warm/deep voice)
        } else {
          color = '180, 200, 255'; // soft blue (balanced)
        }

        // Star size based on voice energy
        const radius = 1 + Math.min(avg / 30, 3);

        const newStar = {
          x: Math.max(40, Math.min(window.innerWidth - 40, x)),
          y: Math.max(40, Math.min(window.innerHeight - 40, y)),
          r: radius,
          color: color,
          phase: Math.random() * Math.PI * 2
        };

        addStar(newStar);
        lastStar = newStar;
        lastStarTime = now;
      }
      
      // Reset constellation flow if there's a long pause (silence breaks the line)
      if (avg < 2 && now - lastStarTime > 1500) {
        lastStar = null;
      }

      requestAnimationFrame(listen);
    }

    listen();
  } catch (err) {
    console.error('Audio error:', err);
    alert('mic error: ' + err.message);
  }
}