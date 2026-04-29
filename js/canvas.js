const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');

let stars = [];
let width, height;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Background ambient stars (very faint)
const ambientStars = Array.from({ length: 150 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: Math.random() * 0.8,
  opacity: Math.random() * 0.3,
  twinkleSpeed: Math.random() * 0.02
}));

export function addStar(star) {
  stars.push(star);
}

export function initSky() {
  animate();
}

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 0, width, height);

  // Draw ambient background stars
  ambientStars.forEach(s => {
    s.opacity += Math.sin(Date.now() * s.twinkleSpeed) * 0.005;
    s.opacity = Math.max(0.05, Math.min(0.5, s.opacity));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
    ctx.fill();
  });

  // Draw whisper stars (with glow + twinkle)
  stars.forEach(star => {
    const twinkle = 0.7 + Math.sin(Date.now() * 0.002 + star.phase) * 0.3;
    
    // Glow
    const gradient = ctx.createRadialGradient(
      star.x, star.y, 0,
      star.x, star.y, star.r * 6
    );
    gradient.addColorStop(0, `rgba(${star.color}, ${0.4 * twinkle})`);
    gradient.addColorStop(1, `rgba(${star.color}, 0)`);
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r * 6, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Core star
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
    ctx.fill();
  });

  // Connect stars with faint lines (constellation)
  if (stars.length > 1) {
    for (let i = 1; i < stars.length; i++) {
      const a = stars[i - 1];
      const b = stars[i];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 300) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - dist / 300)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}
