import { useRef, useEffect, useState } from 'react';
import playerSrc from '../assets/player.jpg';

const GameEngine = ({ isActive, score, setScore, setGameOver, charSrc }) => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  
  // Responsive sizing state
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });

  useEffect(() => {
    const handleResize = () => {
       const width = Math.min(window.innerWidth - 20, 800);
       const height = width < 500 ? 200 : 300; 
       setDimensions({ width, height });
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const state = useRef({
    speed: 7, // Faster start
    distance: 0,
    frames: 0,
    player: {
      x: 50,
      y: 0,
      vy: 0,
      width: 44, 
      height: 44,
      isJumping: false,
      jumpStrength: 15, // Snappier
      gravity: 0.8, // Snappier
    },
    obstacles: [],
    collectibles: [],
    particles: [], // New Particle System
    images: {
      player: new Image(),
    }
  });

  // Load specific charSrc
  useEffect(() => {
     if(charSrc) {
        state.current.images.player.src = charSrc;
     }
  }, [charSrc]);

  // Particle Spawner Helper
  const spawnParticles = (x, y, color, count = 5, type = 'dust') => {
      for(let i=0; i<count; i++) {
          state.current.particles.push({
              x, y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 1.0,
              color,
              type
          });
      }
  };

  const handleJump = () => {
    if (!isActive) return;
    const { player } = state.current;
    if (!player.isJumping) {
      player.vy = player.jumpStrength;
      player.isJumping = true;
      // Spawn Jump Dust
      spawnParticles(player.x + player.width/2, player.y + player.height, '#aaa', 8, 'dust');
    }
  };

  useEffect(() => {
    const handleTouchStart = (e) => {
        if(isActive && e.target.tagName === 'CANVAS') e.preventDefault();
        handleJump();
    };

    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') handleJump();
    };
    const handleMouseDown = () => handleJump();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('mousedown', handleMouseDown);
    // state.current.images.player.src = playerSrc; // Legacy

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isActive]);


  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Background Color
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (isActive) {
      state.current.frames++;
      state.current.distance += state.current.speed;
      // Acceleration: speed increases by 0.0001 per frame (Slower ramp up)
      state.current.speed += 0.0001; 
      setScore(Math.floor(state.current.distance / 10));
    }
    
    updateAndDraw(ctx, WIDTH, HEIGHT);

    if (isActive) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };
  
  const updateAndDraw = (ctx, WIDTH, HEIGHT) => {
    const GROUND_Y = HEIGHT - 30; 
    const { player, obstacles, collectibles, particles, frames, speed } = state.current;
    const COLOR_INK = '#535353';

    // --- PARALLAX BACKGROUND ---
    // Distant Layer (Clouds/Hills) - moves 1/4 speed
    const bgPos = (state.current.distance * 0.25) % WIDTH;
    ctx.fillStyle = '#e5e5e5';
    // Draw 3 "mountains" wrapping
    for(let i=0; i<=1; i++) {
        const offset = i * WIDTH - bgPos;
        ctx.beginPath();
        ctx.moveTo(offset, HEIGHT);
        ctx.lineTo(offset + WIDTH*0.3, HEIGHT - 80);
        ctx.lineTo(offset + WIDTH*0.6, HEIGHT - 40);
        ctx.lineTo(offset + WIDTH, HEIGHT - 100);
        ctx.lineTo(offset + WIDTH, HEIGHT);
        ctx.fill();
    }
    
    // --- PHYSICS & LOGIC ---
    if (isActive) {
        // Player Physics
        player.y -= player.vy; 
        player.vy -= state.current.player.gravity; 

        // Land on Ground
        if (player.y >= GROUND_Y - player.height) {
            if(player.isJumping) {
                // Landed - Spawn Landing Dust
                spawnParticles(player.x + player.width/2, GROUND_Y, '#aaa', 5, 'dust');
            }
            player.y = GROUND_Y - player.height;
            player.vy = 0;
            player.isJumping = false;
        }

        // Spawning
        if (frames % 100 === 0 && Math.random() > 0.4) {
            const type = Math.random() > 0.5 ? 'RUG' : 'REKT';
            obstacles.push({
                x: WIDTH,
                y: GROUND_Y - (type === 'RUG' ? 30 : 50),
                width: 30,
                height: type === 'RUG' ? 30 : 50,
                type: type
            });
        }
        
        if (frames % 150 === 0) {
           const type = Math.random() > 0.6 ? 'WL' : 'MONEY';
           collectibles.push({
               x: WIDTH,
               y: GROUND_Y - 80 - Math.random() * 60,
               width: 20, // Collectible size
               height: 20,
               type: type
           }); 
        }

        // Update Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.x -= speed;
            // Collision
            if (
                player.x < obs.x + obs.width - 5 &&
                player.x + player.width > obs.x + 5 &&
                player.y < obs.y + obs.height - 5 &&
                player.y + player.height > obs.y + 5
            ) {
                // Spawn Explosion
                spawnParticles(player.x, player.y, '#ef4444', 20, 'explosion');
                setGameOver(true);
                return; 
            }
            if (obs.x + obs.width < 0) obstacles.splice(i, 1);
        }

        // Update Collectibles
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const col = collectibles[i];
            col.x -= speed;
            if (
                player.x < col.x + col.width &&
                player.x + player.width > col.x &&
                player.y < col.y + col.height &&
                player.y + player.height > col.y
            ) {
                setScore(s => s + (col.type === 'WL' ? 300 : 100));
                // Spawn Sparkles
                spawnParticles(col.x, col.y, col.type === 'WL' ? '#06b6d4' : '#eab308', 10, 'sparkle');
                collectibles.splice(i, 1);
            } else if (col.x + col.width < 0) {
                collectibles.splice(i, 1);
            }
        }
        
        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if(p.type === 'dust') p.vy -= 0.1; // rise
            else p.vy += 0.2; // gravity for sparks
            
            if(p.life <= 0) particles.splice(i, 1);
        }
    }

    // --- DRAWING ---
    // Ground Line
    ctx.strokeStyle = COLOR_INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(WIDTH, GROUND_Y);
    ctx.stroke();

    // Ground Speed Lines (Foreground parallax)
    ctx.fillStyle = '#9ca3af';
    for(let i=0; i<12; i++) {
        const gx = ((state.current.distance * 1.5 + i*150) % WIDTH); // 1.5x speed for foreground
        const realX = (i*150 - state.current.distance * 1.5) % WIDTH;
        const loopX = realX < 0 ? realX + WIDTH : realX;
        ctx.fillRect(loopX, GROUND_Y + 8 + (i%2)*6, 8, 3);
    }

    // Draw Particles (Behind objects?) or Front? Front usually.
    // Let's draw Obstacles first.

    obstacles.forEach(obs => {
        ctx.fillStyle = obs.type === 'RUG' ? '#ef4444' : '#9333ea'; 
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Shadow/Bevel
        ctx.fillRect(obs.x + 4, obs.y + 4, obs.width - 4, obs.height - 4);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(obs.type, obs.x + obs.width/2, obs.y + obs.height/2 + 4);
    });

    collectibles.forEach(col => {
        const isWL = col.type === 'WL';
        const color = isWL ? '#06b6d4' : '#eab308'; 
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        
        if (isWL) {
             ctx.strokeRect(col.x, col.y, col.width, col.height);
             ctx.fillStyle = color;
             ctx.textAlign = 'center';
             ctx.font = 'bold 10px monospace';
             ctx.fillText('WL', col.x + col.width/2, col.y + col.height/2 + 3);
        } else {
             ctx.beginPath();
             ctx.arc(col.x + col.width/2, col.y + col.height/2, col.width/2, 0, Math.PI*2);
             ctx.stroke();
             ctx.fillStyle = color;
             ctx.textAlign = 'center';
             ctx.font = 'bold 12px monospace';
             ctx.fillText('$', col.x + col.width/2, col.y + col.height/2 + 4);
        }
    });

    // Player
    if (state.current.images.player.complete) {
        ctx.drawImage(state.current.images.player, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = COLOR_INK;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Draw Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        const size = p.type === 'dust' ? 4 : 3;
        ctx.fillRect(p.x, p.y, size, size);
    });
    ctx.globalAlpha = 1.0;

  };

  useEffect(() => {
    if (isActive) {
        // Reset
        state.current.player.y = 300; 
        state.current.player.vy = 0;
        state.current.obstacles = [];
        state.current.collectibles = [];
        state.current.particles = [];
        state.current.distance = 0;
        state.current.speed = 7; // Reset speed
        
        requestRef.current = requestAnimationFrame(animate);
    } else {
        const canvas = canvasRef.current;
        if (canvas) {
            updateAndDraw(canvas.getContext('2d'), canvas.width, canvas.height);
        }
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isActive, dimensions]); 

  return (
    <canvas 
      ref={canvasRef} 
      width={dimensions.width} 
      height={dimensions.height} 
      className="max-w-full border-b border-[#535353] bg-[#f7f7f7]"
    />
  );
};

export default GameEngine;
