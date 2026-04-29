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
    
    console.log('✅ Mic access granted');
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Resume context (browsers often start it suspended)
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    
    // 🐛 DEBUG: show audio levels on screen
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      color: #0f0;
      font-family: monospace;
      font-size: 14px;
      z-index: 1000;
      background: rgba(0,0,0,0.5);
      padding: 10px;
      border-radius: 4px;
    `;
    document.body.appendChild(debugDiv);
    
    let lastStarTime = 0;
    let maxSeen = 0;

    function listen() {
      analyser.getByteFrequencyData(data);

      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      maxSeen = Math.max(maxSeen, avg);

      let maxVal = 0, maxIdx = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i] > maxVal) {
          maxVal = data[i];
          maxIdx = i;
        }
      }

      // 🐛 DEBUG output
      debugDiv.innerHTML = `
        🎤 current: ${avg.toFixed(1)}<br>
        📊 peak ever: ${maxSeen.toFixed(1)}<br>
        🎵 dominant freq idx: ${maxIdx}<br>
        ${avg > 5 ? '✨ HEARING YOU' : '🔇 silence...'}
      `;

      const now = Date.now();
      
      // LOWERED threshold for testing — was 8, now 3
      if (avg > 3 && now - lastStarTime > 120) {
        const freqRatio = maxIdx / data.length;
        const x = freqRatio * window.innerWidth + (Math.random() - 0.5) * 100;
        const y = window.innerHeight / 2 + (Math.random() - 0.5) * 400 - avg * 3;

        const hue = freqRatio < 0.3 
          ? '255, 220, 180'
          : freqRatio < 0.6
          ? '180, 200, 255'
          : '220, 180, 255';

        addStar({
          x: Math.max(50, Math.min(window.innerWidth - 50, x)),
          y: Math.max(50, Math.min(window.innerHeight - 50, y)),
          r: 1 + Math.random() * 2,
          color: hue,
          phase: Math.random() * Math.PI * 2
        });

        lastStarTime = now;
      }

      requestAnimationFrame(listen);
    }

    listen();
  } catch (err) {
    console.error('🚨 Audio error:', err);
    alert('mic error: ' + err.message);
  }
}