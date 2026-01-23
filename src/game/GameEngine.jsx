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
    speed: 6,
    distance: 0,
    frames: 0,
    player: {
      x: 50,
      y: 0,
      vy: 0,
      width: 44, 
      height: 44,
      isJumping: false,
      jumpStrength: 13,
      gravity: 0.6,
    },
    obstacles: [],
    collectibles: [],
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

  const handleJump = () => {
    if (!isActive) return;
    const { player } = state.current;
    if (!player.isJumping) {
      player.vy = player.jumpStrength;
      player.isJumping = true;
    }
  };
// ... (middle code unchanged)


  useEffect(() => {
    // Prevent default touch behaviors like scroll
    const handleTouchStart = (e) => {
        // Only prevent if touching canvas area roughly?
        // Actually, just prevent default to stop scrolling if game is active
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
    // state.current.images.player.src = playerSrc; // Removed to allow prop control

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
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (isActive) {
      state.current.frames++;
      state.current.distance += state.current.speed;
      state.current.speed += 0.0005; 
      setScore(Math.floor(state.current.distance / 10));
    }
    
    updateAndDraw(ctx, WIDTH, HEIGHT);

    if (isActive) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };
  
  const updateAndDraw = (ctx, WIDTH, HEIGHT) => {
    const GROUND_Y = HEIGHT - 30; 
    const { player, obstacles, collectibles, frames, speed } = state.current;
    const COLOR_INK = '#535353';

    if (isActive) {
        // Physics
        player.y -= player.vy; 
        player.vy -= state.current.player.gravity; 

        if (player.y >= GROUND_Y - player.height) {
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
               width: 20,
               height: 20,
               type: type
           }); 
        }

        // Updates
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.x -= speed;
            if (
                player.x < obs.x + obs.width - 5 &&
                player.x + player.width > obs.x + 5 &&
                player.y < obs.y + obs.height - 5 &&
                player.y + player.height > obs.y + 5
            ) {
                setGameOver(true);
                return; 
            }
            if (obs.x + obs.width < 0) obstacles.splice(i, 1);
        }

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
                collectibles.splice(i, 1);
            } else if (col.x + col.width < 0) {
                collectibles.splice(i, 1);
            }
        }
    }

    // DRAWING
    ctx.strokeStyle = COLOR_INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = '#757575';
    for(let i=0; i<10; i++) {
        const gx = ((state.current.distance + i*150) % WIDTH);
        const realX = (i*150 - state.current.distance) % WIDTH;
        const loopX = realX < 0 ? realX + WIDTH : realX;
        ctx.fillRect(loopX, GROUND_Y + 5 + (i%3)*4, 4, 2);
    }

    if (state.current.images.player.complete) {
        ctx.drawImage(state.current.images.player, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = COLOR_INK;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    obstacles.forEach(obs => {
        // Color coding
        ctx.fillStyle = obs.type === 'RUG' ? '#ef4444' : '#9333ea'; // Red or Purple
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        // Retro bevel effect
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(obs.x + 4, obs.y + 4, obs.width - 4, obs.height - 4);

        // White Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(obs.type, obs.x + obs.width/2, obs.y + obs.height/2 + 4);
    });

    collectibles.forEach(col => {
        const isWL = col.type === 'WL';
        const color = isWL ? '#06b6d4' : '#eab308'; // Cyan or Gold
        
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

    const cloudSpeed = state.current.distance * 0.2;
    ctx.fillStyle = '#d1d1d1'; 
    const cloudY = HEIGHT * 0.2; // responsive cloud height
    const cloudX = (WIDTH - (cloudSpeed % (WIDTH + 100)));
    ctx.fillRect(cloudX, cloudY, 40, 10);
    ctx.fillRect(cloudX + 10, cloudY - 10, 20, 10);
  };

  useEffect(() => {
    if (isActive) {
        state.current.obstacles = [];
        state.current.collectibles = [];
        state.current.distance = 0;
        state.current.speed = 6;
        requestRef.current = requestAnimationFrame(animate);
    } else {
        const canvas = canvasRef.current;
        if (canvas) {
            updateAndDraw(canvas.getContext('2d'), canvas.width, canvas.height);
        }
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isActive, dimensions]); // Redraw on resize

  return (
    <canvas 
      ref={canvasRef} 
      width={dimensions.width} 
      height={dimensions.height} 
      className="max-w-full border-b border-[#535353]"
    />
  );
};

export default GameEngine;
