import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { useCurrency } from '../context/CurrencyContext';

// Canvas-based Retro Snake Game
const SnakeGame = ({ themeColor }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('snake_highscore') || '0')
  );

  const gridCount = 20;
  const canvasSize = 300;
  const gridSize = canvasSize / gridCount;

  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const directionRef = useRef({ x: 1, y: 0 });
  const nextDirectionRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef({ x: 5, y: 5 });

  const generateFood = () => {
    let rx, ry;
    let onSnake = true;
    const currentSnake = snakeRef.current;
    while (onSnake) {
      rx = Math.floor(Math.random() * gridCount);
      ry = Math.floor(Math.random() * gridCount);
      onSnake = currentSnake.some(part => part.x === rx && part.y === ry);
    }
    return { x: rx, y: ry };
  };

  const restartGame = () => {
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    foodRef.current = generateFood();
    setScore(0);
    setGameOver(false);
  };

  const handleDirectionChange = (newDir) => {
    const curDir = directionRef.current;
    if (newDir.x !== 0 && curDir.x === 0) {
      nextDirectionRef.current = newDir;
    }
    if (newDir.y !== 0 && curDir.y === 0) {
      nextDirectionRef.current = newDir;
    }
  };

  useEffect(() => {
    foodRef.current = generateFood();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') handleDirectionChange({ x: 0, y: -1 });
      if (e.key === 'ArrowDown') handleDirectionChange({ x: 0, y: 1 });
      if (e.key === 'ArrowLeft') handleDirectionChange({ x: -1, y: 0 });
      if (e.key === 'ArrowRight') handleDirectionChange({ x: 1, y: 0 });
    };

    window.addEventListener('keydown', handleKeyDown);

    const gameLoopInterval = setInterval(() => {
      if (gameOver) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      directionRef.current = nextDirectionRef.current;
      const dir = directionRef.current;

      const currentSnake = [...snakeRef.current];
      const head = { x: currentSnake[0].x + dir.x, y: currentSnake[0].y + dir.y };

      if (
        head.x < 0 || head.x >= gridCount ||
        head.y < 0 || head.y >= gridCount ||
        currentSnake.some(part => part.x === head.x && part.y === head.y)
      ) {
        setGameOver(true);
        return;
      }

      currentSnake.unshift(head);

      const food = foodRef.current;
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const next = prev + 10;
          if (next > highScore) {
            setHighScore(next);
            localStorage.setItem('snake_highscore', next.toString());
          }
          return next;
        });
        foodRef.current = generateFood();
      } else {
        currentSnake.pop();
      }

      snakeRef.current = currentSnake;

      ctx.fillStyle = '#0f1424';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < gridCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvasSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvasSize, i * gridSize);
        ctx.stroke();
      }

      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
      ctx.fill();

      const accent = themeColor || '#00f2fe';
      ctx.shadowColor = accent;
      ctx.shadowBlur = 8;
      
      currentSnake.forEach((part, index) => {
        if (index === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 12;
        } else {
          ctx.fillStyle = accent;
          ctx.shadowBlur = 8;
        }
        ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
      });

      ctx.shadowBlur = 0;

    }, 130);

    return () => {
      clearInterval(gameLoopInterval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameOver, highScore, themeColor]);

  return (
    <div className="snake-game-container">
      <div className="game-hud">
        <div className="hud-metric">SCORE: <span className="value">{score}</span></div>
        <div className="hud-metric">BEST: <span className="value">{highScore}</span></div>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={canvasSize} height={canvasSize} className="snake-canvas"></canvas>
        {gameOver && (
          <div className="game-overlay">
            <h3>GAME OVER</h3>
            <p>Score: {score}</p>
            <button className="btn-primary" onClick={restartGame}>🔄 Play Again</button>
          </div>
        )}
      </div>

      <div className="mobile-controls">
        <div className="control-row">
          <button className="control-btn" onClick={() => handleDirectionChange({ x: 0, y: -1 })}>▲</button>
        </div>
        <div className="control-row">
          <button className="control-btn" onClick={() => handleDirectionChange({ x: -1, y: 0 })}>◀</button>
          <button className="control-btn empty-center"></button>
          <button className="control-btn" onClick={() => handleDirectionChange({ x: 1, y: 0 })}>▶</button>
        </div>
        <div className="control-row">
          <button className="control-btn" onClick={() => handleDirectionChange({ x: 0, y: 1 })}>▼</button>
        </div>
      </div>
      <p className="controls-tip">Control with keyboard arrow keys or touch buttons!</p>
    </div>
  );
};

// Emojis Food Card Memory Match Game
const MemoryMatch = ({ themeColor }) => {
  const foodEmojis = ['🍕', '🍔', '🍟', '🍩', '🍦', '🥤', '🌮', '🍣'];
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [win, setWin] = useState(false);

  const initGame = () => {
    const deck = [...foodEmojis, ...foodEmojis]
      .map((emoji, idx) => ({ id: idx, emoji, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setWin(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (idx) => {
    if (win || cards[idx].isFlipped || cards[idx].isMatched || flippedIndices.length >= 2) return;

    const newCards = [...cards];
    newCards[idx].isFlipped = true;
    setCards(newCards);

    const nextFlipped = [...flippedIndices, idx];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [firstIdx, secondIdx] = nextFlipped;

      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        setTimeout(() => {
          newCards[firstIdx].isMatched = true;
          newCards[secondIdx].isMatched = true;
          setCards([...newCards]);
          setFlippedIndices([]);
          setMatches(prev => {
            const next = prev + 1;
            if (next === foodEmojis.length) {
              setWin(true);
            }
            return next;
          });
        }, 500);
      } else {
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="memory-game-container">
      <div className="game-hud">
        <div className="hud-metric">MOVES: <span className="value">{moves}</span></div>
        <div className="hud-metric">MATCHES: <span className="value">{matches}/8</span></div>
      </div>

      <div className="memory-grid-wrapper">
        <div className="memory-grid">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              className={`memory-card ${card.isFlipped || card.isMatched ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
              onClick={() => handleCardClick(idx)}
              style={{ '--card-accent': themeColor || '#00f2fe' }}
            >
              <div className="card-inner">
                <div className="card-face card-front">
                  {card.emoji}
                </div>
                <div className="card-face card-back">
                  ❓
                </div>
              </div>
            </button>
          ))}
        </div>

        {win && (
          <div className="game-overlay">
            <h3>VICTORY!</h3>
            <p>Completed in {moves} moves!</p>
            <button className="btn-primary" onClick={initGame}>🔄 Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Combined Game Suite Wrapper (Solo Mode)
const GameSuite = ({ themeColor }) => {
  const [selectedGame, setSelectedGame] = useState('snake');

  return (
    <div className="game-suite-container glass-card">
      <div className="game-suite-tabs">
        <button 
          className={`suite-tab-btn ${selectedGame === 'snake' ? 'active' : ''}`}
          onClick={() => setSelectedGame('snake')}
          style={{ '--btn-accent-color': themeColor }}
        >
          🐍 Retro Snake
        </button>
        <button 
          className={`suite-tab-btn ${selectedGame === 'memory' ? 'active' : ''}`}
          onClick={() => setSelectedGame('memory')}
          style={{ '--btn-accent-color': themeColor }}
        >
          🎴 Memory Match
        </button>
      </div>

      <div className="game-suite-body">
        {selectedGame === 'snake' ? (
          <SnakeGame themeColor={themeColor} />
        ) : (
          <MemoryMatch themeColor={themeColor} />
        )}
      </div>
    </div>
  );
};

// Realtime Waiting Room Countdown Timer
const WaitingRoomCountdown = () => {
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const format = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="waiting-countdown-badge">
      <span>⏰ Est. Meal Arrival: <strong>{format(secondsLeft)}</strong></span>
    </div>
  );
};

// Family Mode Ambient Clock Component
const FamilyMode = ({ cafeName, tableId, cafeId }) => {
  const { fetchOrders } = useSupabase();
  const [time, setTime] = useState(new Date());
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const quotes = [
    "Put down your phones, look up, and enjoy the company.",
    "Good food is sweeter when shared with family.",
    "Take a deep breath. You are right where you need to be.",
    "In this moment, let's connect and share a smile.",
    "Happiness is a kitchen full of family and a table full of food."
  ];

  useEffect(() => {
    const loadGallery = async () => {
      if (cafeId) {
        const orders = await fetchOrders(cafeId);
        if (orders) {
          const photos = [];
          orders.forEach(order => {
            if (order.bill_photos) {
              try {
                const parsed = JSON.parse(order.bill_photos);
                if (Array.isArray(parsed)) {
                  photos.push(...parsed);
                }
              } catch (e) {}
            }
          });
          setGalleryPhotos(photos);
        }
      }
    };
    loadGallery();
  }, [cafeId]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const quoteTimer = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % quotes.length);
    }, 8000);

    return () => {
      clearInterval(timer);
      clearInterval(quoteTimer);
    };
  }, []);

  useEffect(() => {
    if (galleryPhotos.length > 1) {
      const t = setInterval(() => {
        setActivePhotoIdx(prev => (prev + 1) % galleryPhotos.length);
      }, 6000);
      return () => clearInterval(t);
    }
  }, [galleryPhotos]);

  const formatTime = (t) => {
    let hours = t.getHours();
    let minutes = t.getMinutes();
    let seconds = t.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    return { timeStr: `${hours}:${minutes}:${seconds}`, ampm };
  };

  const { timeStr, ampm } = formatTime(time);
  const dateStr = time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="family-clock-container glass-card">
      <div className="ambient-background-glow"></div>
      
      <div className="clock-digits-wrapper">
        <h1 className="clock-time">{timeStr} <span className="clock-ampm">{ampm}</span></h1>
        <p className="clock-date">{dateStr}</p>
      </div>

      <div className="breathing-circle-wrapper">
        <div className="breathing-circle"></div>
        <div className="breathing-text-overlay">
          <span className="breathe-label">Breathe In... Breathe Out...</span>
        </div>
      </div>

      <div className="quote-display-card">
        <p className="animated-quote">"{quotes[quoteIndex]}"</p>
      </div>

      {galleryPhotos.length > 0 && (
        <div className="ugc-media-panel-card glass-card">
          <h4>📸 Shared Dining Memories</h4>
          <div className="media-panel-slider">
            <img src={galleryPhotos[activePhotoIdx]} alt="Table memory share" className="media-slider-img" />
          </div>
          <span className="media-slider-caption">Shared by previous guests here!</span>
        </div>
      )}

      <div className="family-status-info">
        <span>Table {tableId || 'N/A'}</span>
        <span>•</span>
        <span>{cafeName || 'Cafe'}</span>
      </div>
    </div>
  );
};

// Voucher Code Unlock Screen
const VoucherUnlockScreen = ({ themeColor, onClear }) => {
  const [scratched, setScratched] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const voucherCode = "YUMMYDINE20";
  
  const handleCopy = () => {
    navigator.clipboard.writeText(voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="voucher-unlock-fullscreen glass-blur animated-fade-in">
      <div className="voucher-card glass-card animated-zoom-in">
        <div className="voucher-emoji-rain">✨ 🎉 🥞 🍔 ✨</div>
        <h2>🎉 Congratulations!</h2>
        <h3 style={{ fontSize: '1.1rem', margin: '8px 0 16px 0', color: 'var(--customer-accent)', fontWeight: 700 }}>
          You unlocked a 20% discount voucher!
        </h3>
        <p className="voucher-thanks" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
          Thank you for sharing your experience photos. Your bill has been approved by the waiter staff!
        </p>
        
        <div className="scratch-card-container">
          {!scratched ? (
            <button className="btn-scratch-cover" onClick={() => setScratched(true)}>
              <span className="scratch-shine">✨ Tap to Scratch & Reveal Voucher ✨</span>
            </button>
          ) : (
            <div className="scratch-revealed-card animated-pop-in">
              <span className="voucher-label">20% OFF NEXT VISIT</span>
              <div className="voucher-code-display">{voucherCode}</div>
              <button className="btn-copy-code" onClick={handleCopy}>
                {copied ? 'Copied! 📋' : 'Copy Voucher Code 📋'}
              </button>
            </div>
          )}
        </div>

        {/* Focus note for saving/keeping code safely */}
        <div className="voucher-focus-note">
          💡 <strong>Important:</strong> Please keep this code safely to avail the discount for your next order! You can take a screenshot or save it in your notes for your next visit. Thank you!
        </div>

        <button className="btn-primary btn-close-voucher" onClick={onClear} style={{ background: themeColor, color: '#0b0f19', marginTop: '1.5rem', width: '100%' }}>
          Done & Back to Menu
        </button>
      </div>
    </div>
  );
};

// ─── Veg / Non-Veg Dot Indicator ───────────────────────────────────────────────
const VegDot = ({ isVeg }) => (
  <span
    className={`veg-dot ${isVeg ? 'veg' : 'non-veg'}`}
    title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
  />
);

// ─── Category icon map ──────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  'All': '🍽️',
  'Starter': '🥗',
  'Main Course': '🍛',
  'Drinks & Beverages': '🥤',
  'Fast Food': '🍟',
};

// ─── Predefined category order ─────────────────────────────────────────────────
const PREDEFINED_CATEGORIES = ['All', 'Starter', 'Main Course', 'Drinks & Beverages', 'Fast Food'];

// ─── Status step definitions ────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'sent',     label: 'Sent',    statuses: ['pending','preparing','ready','completed','bill_requested','bill_approved','cancelled'] },
  { key: 'cooking',  label: 'Cooking', statuses: ['preparing','ready','completed','bill_requested','bill_approved'] },
  { key: 'ready',    label: 'Ready',   statuses: ['ready','completed','bill_requested','bill_approved'] },
  { key: 'served',   label: 'Served',  statuses: ['completed','bill_requested','bill_approved'] },
  { key: 'checkout', label: 'Checkout',statuses: ['bill_requested','bill_approved'] },
];

export default function CustomerView() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const cafeId = searchParams.get('cafe');

  const {
    loading,
    error,
    setError,
    supabase,
    fetchCafes,
    fetchMenuItems,
    createOrder,
    uploadImage,
    updateOrder
  } = useSupabase();

  const { formatPrice } = useCurrency();

  // State
  const [cafe, setCafe] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [orderTracking, setOrderTracking] = useState(null);
  const [selectedPortions, setSelectedPortions] = useState({});

  // Toast notification state (replaces browser alert — iOS-safe)
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Cancel confirmation state (mobile-safe, inline)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Assistance summon buzzer state
  const [isBuzzerActive, setIsBuzzerActive] = useState(false);
  const buzzerOrderIdRef = useRef(null);

  // Verification & Wait Mode states
  const [isVerifyingOrder, setIsVerifyingOrder] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [showChoiceOverlay, setShowChoiceOverlay] = useState(false);
  const [activeWaitingMode, setActiveWaitingMode] = useState(null);

  // UGC & Bill Request states
  const [showBillRequestModal, setShowBillRequestModal] = useState(false);
  const [billPhotos, setBillPhotos] = useState([]);
  const [billPhotosPreviews, setBillPhotosPreviews] = useState([]);
  const [uploadingBill, setUploadingBill] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);

  const handleApplyVoucher = () => {
    if (voucherInput.trim().toUpperCase() === 'YUMMYDINE20') {
      setVoucherDiscount(0.20);
      showToast('🎉 Voucher Applied! 20% discount added.', 'success');
    } else {
      showToast('❌ Invalid voucher code.', 'error');
    }
  };

  // Light / Dark mode toggle for customer device
  const [customerTheme, setCustomerTheme] = useState(
    () => localStorage.getItem('cv_theme') || 'dark'
  );
  const toggleCustomerTheme = () => {
    setCustomerTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('cv_theme', next);
      return next;
    });
  };

  useEffect(() => {
    document.body.setAttribute('data-cv-theme', customerTheme);
    return () => {
      document.body.removeAttribute('data-cv-theme');
    };
  }, [customerTheme]);

  // Theme color parsing effect
  useEffect(() => {
    if (cafe?.theme_color) {
      document.documentElement.style.setProperty('--customer-accent', cafe.theme_color);
      
      const hex = cafe.theme_color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        document.documentElement.style.setProperty('--customer-accent-rgb', `${r}, ${g}, ${b}`);
      }
    } else {
      document.documentElement.style.setProperty('--customer-accent', '#00f2fe');
      document.documentElement.style.setProperty('--customer-accent-rgb', '0, 242, 254');
    }
  }, [cafe]);

  // Fetch Cafe Details
  useEffect(() => {
    loadCafeDetails(cafeId);
  }, [cafeId]);

  // Load order tracking state from localstorage if exists
  useEffect(() => {
    if (cafeId && tableId) {
      const savedOrder = localStorage.getItem(`placed_order_cafe_${cafeId}_table_${tableId}`);
      if (savedOrder) {
        try {
          const parsed = JSON.parse(savedOrder);
          setPlacedOrder(parsed);
          setOrderTracking(parsed);
        } catch (e) {
          console.error('Error loading saved order', e);
        }
      }
    }
  }, [cafeId, tableId]);

  // Subscribe to real-time updates for the placed order
  useEffect(() => {
    if (placedOrder?.id) {
      const channel = supabase
        .channel(`order-track-${placedOrder.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${placedOrder.id}` },
          (payload) => {
            console.log('Customer Order Updated Realtime:', payload.new);
            setOrderTracking(payload.new);
            localStorage.setItem(`placed_order_cafe_${cafeId}_table_${tableId}`, JSON.stringify(payload.new));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [placedOrder]);

  // Subscribe to BroadcastChannel for mock realtime updates when offline/fallback
  useEffect(() => {
    if (placedOrder?.id) {
      const channel = new BroadcastChannel('supabase-realtime-mock');
      const handleMessage = (e) => {
        const payload = e.data;
        if (payload.new && String(payload.new.id) === String(placedOrder.id)) {
          console.log('Customer Order Updated Mock Realtime:', payload.new);
          setOrderTracking(payload.new);
          localStorage.setItem(`placed_order_cafe_${cafeId}_table_${tableId}`, JSON.stringify(payload.new));
        }
      };
      channel.addEventListener('message', handleMessage);
      return () => {
        channel.removeEventListener('message', handleMessage);
        channel.close();
      };
    }
  }, [placedOrder, cafeId, tableId]);

  const loadCafeDetails = async (id) => {
    try {
      setError(null);
      const cafesList = await fetchCafes();
      if (cafesList && cafesList.length > 0) {
        let foundCafe = cafesList.find(c => String(c.id) === String(id));
        if (!foundCafe) {
          console.warn(`Cafe with ID ${id} not found. Falling back to first available cafe.`);
          foundCafe = cafesList[0];
        }
        setCafe(foundCafe);
        loadMenuItems(foundCafe.id);
      } else {
        setError('No cafes found. Please create a cafe in the Admin Panel first.');
      }
    } catch (err) {
      console.error('Error fetching cafe details:', err);
      setError('Could not find cafe details. Check if the Cafe ID is valid.');
    }
  };

  const loadMenuItems = async (id) => {
    const data = await fetchMenuItems(id);
    if (data) {
      const activeItems = data.filter(item => item.is_available);
      setMenuItems(activeItems);
      
      const defaults = {};
      activeItems.forEach(item => {
        if (item.portion_options && item.portion_options.length > 0) {
          defaults[item.id] = item.portion_options[0];
        }
      });
      setSelectedPortions(defaults);
    }
  };

  // Cart Helper Functions
  const handleAddToCart = (item) => {
    const selectedPortion = selectedPortions[item.id] || null;
    const cartItemId = selectedPortion ? `${item.id}-${selectedPortion}` : `${item.id}`;

    setCart(prev => {
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { cartItemId, item, portion: selectedPortion, quantity: 1 }];
    });
    showToast(`✅ ${item.name} added to order!`, 'success');
  };

  const handleUpdateQuantity = (cartItemId, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
    } else {
      setCart(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: qty } : i));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsVerifyingOrder(true);
    setVerificationStep(0);

    const stepsTimer = setInterval(() => {
      setVerificationStep(prev => {
        if (prev >= 3) {
          clearInterval(stepsTimer);
          return 3;
        }
        return prev + 1;
      });
    }, 1000);

    const itemsStr = cart.map(cartItem => {
      const portionText = cartItem.portion ? ` (${cartItem.portion})` : '';
      return `${cartItem.quantity}x ${cartItem.item.name}${portionText}`;
    }).join(', ');
    const total = getCartTotal();

    const orderData = {
      cafe_id: parseInt(cafe?.id || cafeId),
      table_number: tableId || 'General',
      items: itemsStr,
      total_price: total,
      status: 'pending'
    };

    try {
      const newOrder = await createOrder(orderData);
      if (newOrder) {
        setTimeout(() => {
          setIsVerifyingOrder(false);
          setPlacedOrder(newOrder);
          setOrderTracking(newOrder);
          setCart([]);
          localStorage.setItem(`placed_order_cafe_${cafeId}_table_${tableId}`, JSON.stringify(newOrder));
          setShowChoiceOverlay(true);
        }, 4000);
      } else {
        clearInterval(stepsTimer);
        setIsVerifyingOrder(false);
        setError('Checkout failed. Please verify connection and try again.');
      }
    } catch (err) {
      clearInterval(stepsTimer);
      setIsVerifyingOrder(false);
      setError('An error occurred during order confirmation.');
    }
  };

  // Call waiter assistance buzzer request
  const handleCallWaiter = async () => {
    if (isBuzzerActive) return;
    setIsBuzzerActive(true);
    try {
      const buzzerOrder = {
        cafe_id: parseInt(cafe?.id || cafeId),
        table_number: tableId || 'General',
        items: '🚨 ASSISTANCE REQUESTED (Table needs waiter help)',
        total_price: 0,
        status: 'assistance_needed'
      };
      
      const created = await createOrder(buzzerOrder);
      if (created) {
        buzzerOrderIdRef.current = created.id;
        showToast('🛎️ Waiter called! A staff member is on their way.', 'success');

        const channel = supabase
          .channel(`buzzer-track-${created.id}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${created.id}` },
            (payload) => {
              if (payload.new.status === 'assistance_resolved') {
                setIsBuzzerActive(false);
                buzzerOrderIdRef.current = null;
                supabase.removeChannel(channel);
                showToast('✅ Waiter is on their way!', 'success');
              }
            }
          )
          .subscribe();
      } else {
        setIsBuzzerActive(false);
        showToast('Could not reach the staff system. Please wave for assistance.', 'error');
      }
    } catch (e) {
      console.error(e);
      setIsBuzzerActive(false);
      showToast('Connection error. Please try again.', 'error');
    }
  };

  // Photo uploads & Bill request submits
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalFiles = [...billPhotos, ...files].slice(0, 3);
    setBillPhotos(totalFiles);
    
    const previews = totalFiles.map(file => URL.createObjectURL(file));
    setBillPhotosPreviews(previews);
  };

  const handleRemovePhoto = (index) => {
    const nextPhotos = billPhotos.filter((_, idx) => idx !== index);
    setBillPhotos(nextPhotos);
    const nextPreviews = billPhotosPreviews.filter((_, idx) => idx !== index);
    setBillPhotosPreviews(nextPreviews);
  };

  const handleSubmitBillRequest = async () => {
    if (billPhotos.length === 0) {
      showToast('Please upload at least 1 photo of your experience!', 'error');
      return;
    }
    
    setUploadingBill(true);
    setError(null);
    
    try {
      const uploadedUrls = [];
      for (const file of billPhotos) {
        const url = await uploadImage(file, 'experience_photos');
        if (url) {
          uploadedUrls.push(url);
        }
      }
      
      let finalPrice = orderTracking.total_price;
      let finalItems = orderTracking.items;
      
      if (voucherDiscount > 0) {
        const voucherDiscountAmount = finalPrice * voucherDiscount;
        finalPrice = finalPrice - voucherDiscountAmount;
        finalItems = finalItems + `\n[🎟️ 20% Voucher Applied]`;
      }
      
      const itemsCount = [...orderTracking.items.matchAll(/(\d+)x/g)].reduce((sum, match) => sum + parseInt(match[1]), 0);
      const minItems = cafe?.discount_min_items || 0;
      const discountPercent = cafe?.discount_percentage || 0;
      
      if (minItems > 0 && discountPercent > 0 && itemsCount >= minItems) {
        const discountAmount = finalPrice * (discountPercent / 100);
        finalPrice = finalPrice - discountAmount;
        finalItems = finalItems + `\n[🎁 ${discountPercent}% UGC Discount Applied]`;
      }
      
      const updated = await updateOrder(orderTracking.id, { 
        status: 'bill_requested',
        total_price: finalPrice,
        items: finalItems,
        bill_photos: JSON.stringify(uploadedUrls)
      });
      
      if (updated) {
        setOrderTracking(updated);
        setPlacedOrder(updated);
        localStorage.setItem(`placed_order_cafe_${cafeId}_table_${tableId}`, JSON.stringify(updated));
        setShowBillRequestModal(false);
        setBillPhotos([]);
        setBillPhotosPreviews([]);
      } else {
        setError('Failed to request bill. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred while uploading photos.');
    } finally {
      setUploadingBill(false);
    }
  };

  const handleRequestBillNoPhotos = async () => {
    try {
      let finalPrice = orderTracking.total_price;
      let finalItems = orderTracking.items;

      if (voucherDiscount > 0) {
        const voucherDiscountAmount = finalPrice * voucherDiscount;
        finalPrice = finalPrice - voucherDiscountAmount;
        finalItems = finalItems + `\n[🎟️ 20% Voucher Applied]`;
      }

      const updated = await updateOrder(orderTracking.id, { 
        status: 'bill_requested',
        total_price: finalPrice,
        items: finalItems
      });
      if (updated) {
        setOrderTracking(updated);
        setPlacedOrder(updated);
        localStorage.setItem(`placed_order_cafe_${cafeId}_table_${tableId}`, JSON.stringify(updated));
      }
    } catch (err) {
      console.error(err);
      showToast('Error requesting bill', 'error');
    }
  };


  const handleClearTracking = () => {
    localStorage.removeItem(`placed_order_cafe_${cafeId}_table_${tableId}`);
    setPlacedOrder(null);
    setOrderTracking(null);
    setShowCancelConfirm(false);
  };

  // Build categories: predefined first, then any extras from DB
  const dbCategories = [...new Set(menuItems.map(item => item.category))];
  const categories = [
    ...PREDEFINED_CATEGORIES,
    ...dbCategories.filter(c => !PREDEFINED_CATEGORIES.includes(c))
  ].filter(cat => cat === 'All' || dbCategories.includes(cat));

  const filteredMenuItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  // "Most Ordered" = first 6 items (or items flagged popular if field exists)
  const mostOrderedItems = menuItems.filter(item => item.is_popular).length > 0
    ? menuItems.filter(item => item.is_popular).slice(0, 6)
    : menuItems.slice(0, Math.min(6, menuItems.length));

  if (loading && !cafe) {
    return (
      <div className="customer-loading">
        <div className="spinner"></div>
        <p>Loading digital menu...</p>
      </div>
    );
  }

  // Cart helpers
  const cartCount = cart.reduce((t, i) => t + i.quantity, 0);
  const cartTotal = cart.reduce((t, i) => t + i.item.price * i.quantity, 0);

  return (
    <div
      className="customer-container animated-fade-in"
      data-cv-theme={customerTheme}
      style={{ '--customer-accent': cafe?.theme_color || '#00f2fe' }}
    >

      {/* Toast Notification (iOS-safe, replaces alert) */}
      {toast && (
        <div className={`customer-toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
      
      {activeWaitingMode && (
        <div className="waiting-mode-fullscreen-container animated-fade-in">
          <div className="mode-top-bar glass-card">
            <div className="waiting-title-wrapper">
              <h3>⏳ Table {tableId || 'N/A'} Waiting Room</h3>
              <WaitingRoomCountdown />
            </div>
            <button className="btn-exit-mode" onClick={() => setActiveWaitingMode(null)}>
              Exit to Menu ✕
            </button>
          </div>
          <div className="mode-body-wrapper">
            {activeWaitingMode === 'solo' ? (
              <GameSuite themeColor={cafe?.theme_color} />
            ) : (
              <FamilyMode cafeName={cafe?.name} tableId={tableId} cafeId={cafeId} />
            )}
          </div>
        </div>
      )}

      {isVerifyingOrder && (
        <div className="verification-overlay-fullscreen glass-blur animated-fade-in">
          <div className="verification-card glass-card animated-zoom-in">
            <div className="verification-spinner-wrapper">
              <div className="glow-ring"></div>
              {verificationStep < 3 ? (
                <div className="bouncing-food-loop">
                  <span className="bouncing-food emoji-1">🍕</span>
                  <span className="bouncing-food emoji-2">🍔</span>
                  <span className="bouncing-food emoji-3">🍟</span>
                  <span className="bouncing-food emoji-4">🍩</span>
                </div>
              ) : (
                <div className="checkmark-success animated-checkmark">✓</div>
              )}
            </div>
            <h2>
              {verificationStep === 0 && "Submitting Order..."}
              {verificationStep === 1 && "Chefs verifying inventory stocks..."}
              {verificationStep === 2 && "Kitchen Sync..."}
              {verificationStep === 3 && "Order Confirmed!"}
            </h2>
            <div className="verification-stepper">
              <span className={`step-dot ${verificationStep >= 0 ? 'active' : ''}`}></span>
              <span className={`step-dot ${verificationStep >= 1 ? 'active' : ''}`}></span>
              <span className={`step-dot ${verificationStep >= 2 ? 'active' : ''}`}></span>
              <span className={`step-dot ${verificationStep >= 3 ? 'active' : ''}`}></span>
            </div>
            <p className="verification-tip">
              {verificationStep === 0 && "Connecting to secure order queue..."}
              {verificationStep === 1 && "Validating restaurant tables config..."}
              {verificationStep === 2 && "Synchronizing live Waiter Dashboard..."}
              {verificationStep === 3 && "Redirecting to your digital table waiting suite..."}
            </p>
          </div>
        </div>
      )}

      {showChoiceOverlay && (
        <div className="verification-overlay-fullscreen glass-blur animated-fade-in">
          <div className="choice-panel-card glass-card animated-zoom-in">
            <div className="choice-header">
              <span className="success-badge-icon">🎉</span>
              <h2>Your order is in the queue!</h2>
              <p>How would you like to spend your wait time?</p>
            </div>
            <div className="choice-options-grid">
              <button 
                className="choice-mode-card solo-card-btn" 
                onClick={() => {
                  setActiveWaitingMode('solo');
                  setShowChoiceOverlay(false);
                }}
              >
                <div className="mode-icon">🎮</div>
                <h3>Solo Mode</h3>
                <p>Play our classic canvas-based retro game suite on your device.</p>
              </button>
              <button 
                className="choice-mode-card family-card-btn" 
                onClick={() => {
                  setActiveWaitingMode('family');
                  setShowChoiceOverlay(false);
                }}
              >
                <div className="mode-icon">🕒</div>
                <h3>Family Mode</h3>
                <p>Minimalist ambient screen with clock, breathing cycle & quotes.</p>
              </button>
            </div>
            <button className="btn-secondary-choice" onClick={() => setShowChoiceOverlay(false)}>
              Skip & View Order Status
            </button>
          </div>
        </div>
      )}

      {/* UGC Experience Photo Modal */}
      {showBillRequestModal && (
        <div className="verification-overlay-fullscreen glass-blur animated-fade-in">
          <div className="bill-request-card glass-card animated-zoom-in">
            <div className="bill-request-header">
              <h2>📸 Share Experience & Request Bill</h2>
              <p>Upload up to 3 dining photos (compressed client-side) to request your bill and unlock a reward voucher code!</p>
            </div>
            
            <div className="bill-upload-section">
              <label className="btn-file-select-ugc">
                <span>➕ Select Dining Photos ({billPhotos.length}/3)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handlePhotoSelect} 
                  disabled={billPhotos.length >= 3 || uploadingBill}
                  style={{ display: 'none' }}
                />
              </label>

              {billPhotosPreviews.length > 0 && (
                <div className="bill-previews-grid">
                  {billPhotosPreviews.map((src, idx) => (
                    <div key={idx} className="bill-preview-item">
                      <img src={src} alt="Dining Experience Preview" />
                      <button 
                        type="button" 
                        className="btn-remove-preview" 
                        onClick={() => handleRemovePhoto(idx)}
                        disabled={uploadingBill}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bill-modal-actions">
              <button 
                className="btn-bill-cta" 
                onClick={handleSubmitBillRequest}
                disabled={billPhotos.length === 0 || uploadingBill}
              >
                {uploadingBill ? 'Uploading & Compressing...' : '💰 Submit UGC & Request Bill'}
              </button>
              <button 
                className="btn-cancel-order" 
                onClick={() => {
                  setShowBillRequestModal(false);
                  setBillPhotos([]);
                  setBillPhotosPreviews([]);
                }}
                disabled={uploadingBill}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Code Unlock Screen Overlay */}
      {orderTracking && orderTracking.status === 'bill_approved' && (
        <VoucherUnlockScreen 
          themeColor={cafe?.theme_color} 
          onClear={handleClearTracking} 
        />
      )}

      {/* ── HERO HEADER ── */}
      <div className="cv-hero glass-card">
        {/* Top Part: Cafe Brand & Theme Toggle */}
        <div className="cv-hero-top-row">
          <div className="cv-brand-left">
            <img
              src={cafe?.logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=60'}
              alt={cafe?.name || 'Restaurant'}
              className="cv-brand-logo"
            />
            <div className="cv-brand-copy">
              <h1 className="cv-cafe-name">{cafe?.name || 'Restaurant'}</h1>
              {cafe?.location && <p className="cv-cafe-branch">📍 {cafe.location}</p>}
            </div>
          </div>
          <button
            className="cv-theme-toggle"
            onClick={toggleCustomerTheme}
            title={customerTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {customerTheme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Bottom Part: 2-Part Grid for Table No & Call Waiter */}
        <div className="cv-hero-bottom-grid">
          <div className="cv-table-badge">
            <span className="cv-table-label">TABLE</span>
            <span className="cv-table-num">{tableId || 'N/A'}</span>
          </div>
          <button
            className={`cv-call-waiter-btn ${isBuzzerActive ? 'buzzing' : ''}`}
            onClick={handleCallWaiter}
            disabled={isBuzzerActive}
          >
            {isBuzzerActive ? '🔔 Summoned…' : '🙋 Call Waiter'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      {/* ── ORDER TRACKER ── */}
      {orderTracking && (
        <div className="order-tracker-panel glass-card">
          <div className="tracker-header">
            <h3>⏳ Your Order Status</h3>
            <span className={`status-badge badge-${orderTracking.status}`}>
              {orderTracking.status === 'completed' ? 'SERVED ✅' : orderTracking.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>

          {/* 5-step progress bar */}
          <div className="tracker-progress-bar-container">
            {STATUS_STEPS.map((step, idx) => {
              const filled = step.statuses.includes(orderTracking.status);
              return (
                <div key={step.key} className={`progress-segment step-${step.key} ${filled ? 'filled' : ''}`}>
                  <span className="dot"></span>
                  <span className="label">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Status-specific notices */}
          <div className="tracker-details">
            <p><strong>Items:</strong> {orderTracking.items}</p>
            <p><strong>Total:</strong> {formatPrice(orderTracking.total_price || 0)}</p>

            {orderTracking.status === 'completed' && (
              <div className="status-notice notice-served">
                ✅ <strong>Order Served!</strong> Your food has been delivered to the table. Enjoy your meal!
              </div>
            )}
            {orderTracking.status === 'cancelled' && (
              <p className="cancelled-notice">⚠️ Your order was cancelled by the staff.</p>
            )}
            {orderTracking.status === 'delayed' && (
              <p className="delay-notice">⚠️ <strong>Kitchen Delay:</strong> The kitchen is experiencing a slight delay. We are preparing your order as quickly as possible!</p>
            )}
            {orderTracking.status === 'unavailable' && (
              <p className="unavailable-notice">❌ <strong>Item Shortage:</strong> One of your ordered items is currently out of stock. A staff member will visit you shortly to assist.</p>
            )}
            {orderTracking.status === 'bill_requested' && (
              <div className="status-notice notice-checkout">
                ✅ <strong>Checkout in progress!</strong> Your bill has been requested. Please wait while staff processes it.
              </div>
            )}
          </div>

          <div className="tracker-actions">
            {orderTracking.status === 'completed' && !isCheckingOut ? (
              <div className="tracker-buttons-split">
                <button className="btn-place-another" onClick={handleClearTracking} style={{ background: 'transparent', border: '2px solid rgba(var(--customer-accent-rgb), 0.5)', color: 'var(--customer-accent)' }}>
                  🍽️ Place order Again
                </button>
                <button className="btn-bill-cta" onClick={() => setIsCheckingOut(true)}>
                  💰 Request Bill Now
                </button>
              </div>
            ) : isCheckingOut && orderTracking.status !== 'bill_requested' ? (
              <div className="tracker-buttons-checkout" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                {/* Voucher code entry box */}
                <div className="voucher-input-wrapper" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Place the code from your last purchase if any" 
                    value={voucherInput} 
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    disabled={voucherDiscount > 0}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--cv-card-border)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'inherit',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button 
                    className="btn-apply-discount"
                    onClick={handleApplyVoucher}
                    disabled={voucherDiscount > 0 || !voucherInput.trim()}
                    style={{
                      background: voucherDiscount > 0 ? '#10b981' : 'var(--customer-accent)',
                      color: '#0b0f19'
                    }}
                  >
                    {voucherDiscount > 0 ? 'Applied! ✓' : 'Apply Discount'}
                  </button>
                </div>
                {voucherDiscount > 0 && (
                  <p className="voucher-success-text" style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 12px 4px', textAlign: 'left' }}>
                    🎉 Code active! 20% discount will be applied when you request the bill.
                  </p>
                )}

                <div className="tracker-buttons-checkout-actions" style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button className="btn-games-cta" onClick={() => setShowBillRequestModal(true)} style={{ flex: 1, margin: 0 }}>
                    📸 Sent Photos to get discount
                  </button>
                  <button className="btn-bill-cta" onClick={handleRequestBillNoPhotos} style={{ flex: '0 0 auto', width: 'auto', padding: '12px 20px', whiteSpace: 'nowrap', background: 'transparent', border: '2px solid rgba(var(--customer-accent-rgb), 0.5)', color: 'var(--customer-accent)' }}>
                    Req bill
                  </button>
                </div>
              </div>
            ) : orderTracking.status === 'bill_requested' ? (
              <div className="status-notice notice-success-checkout">
                <h3>🎉 Complete!</h3>
                <p>Please wait, our team is reaching out with your bill and physical/QR payment method.</p>
                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Thanks and do visit again! ❤️</p>
              </div>
            ) : orderTracking.status === 'cancelled' ? (
              <button className="btn-place-another" onClick={handleClearTracking}>
                🍽️ Place Another Order
              </button>
            ) : (
              <div className="tracker-buttons-row">
                <button 
                  className="btn-games-cta"
                  onClick={() => setShowChoiceOverlay(true)}
                >
                  🎮 Wait Experience Room
                </button>

                <button 
                  className="btn-bill-cta"
                  onClick={() => setShowBillRequestModal(true)}
                >
                  💰 Request Bill
                </button>

                {/* Cancel Order — with mobile confirmation guard */}
                {!showCancelConfirm ? (
                  <button
                    className="btn-cancel-order"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    ✕ Cancel Order
                  </button>
                ) : (
                  <div className="cancel-confirm-box animated-fade-in">
                    <p className="cancel-confirm-text">⚠️ Are you sure you want to cancel your order?</p>
                    <div className="cancel-confirm-actions">
                      <button
                        className="cancel-confirm-yes"
                        onClick={handleClearTracking}
                      >
                        ✓ Yes, Cancel
                      </button>
                      <button
                        className="cancel-confirm-no"
                        onClick={() => setShowCancelConfirm(false)}
                      >
                        No, Keep Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA (menu + inline cart) ── */}
      <div className="cv-content-area">

        {/* ── MENU SECTION ── */}
        <div className="cv-menu-section">

          {/* Category Filter Scroller */}
          <div className="cv-category-scroller">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cv-cat-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span className="cat-icon">{CATEGORY_ICONS[cat] || '🍴'}</span>
                {cat}
              </button>
            ))}
          </div>

          {/* Most Ordered — horizontal scroller (only show on 'All' filter) */}
          {activeCategory === 'All' && mostOrderedItems.length > 0 && (
            <div className="cv-most-ordered-section">
              <div className="cv-section-title">
                <span className="section-title-icon">🔥</span>
                <h2>Most Ordered</h2>
              </div>
              <div className="cv-horizontal-scroller">
                {mostOrderedItems.map(item => (
                  <div key={item.id} className="cv-popular-card glass-card">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="cv-popular-img" />
                    ) : (
                      <div className="cv-popular-img-placeholder">🍽️</div>
                    )}
                    <div className="cv-popular-info">
                      <div className="cv-popular-name-row">
                        <VegDot isVeg={item.is_veg !== false} />
                        <span className="cv-popular-name">{item.name}</span>
                      </div>
                      <span className="cv-popular-price">{formatPrice(item.price)}</span>
                      {item.description && (
                        <span className="cv-popular-desc">{item.description}</span>
                      )}
                    </div>
                    <button
                      className="cv-popular-add-btn"
                      onClick={() => handleAddToCart(item)}
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Items — vertical list on mobile, 2-col grid on desktop */}
          <div className="cv-all-items-section">
            <div className="cv-section-title">
              <span className="section-title-icon">{CATEGORY_ICONS[activeCategory] || '🍴'}</span>
              <h2>{activeCategory === 'All' ? 'All Items' : activeCategory}</h2>
            </div>

            {filteredMenuItems.length === 0 ? (
              <div className="empty-state glass-card">
                <p>No dishes found in this category.</p>
              </div>
            ) : (
              <div className="cv-items-list">
                {filteredMenuItems.map(item => (
                  <div key={item.id} className="cv-item-card glass-card">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="cv-item-img" />
                    ) : (
                      <div className="cv-item-img-placeholder">🍽️</div>
                    )}
                    <div className="cv-item-body">
                      <div className="cv-item-top">
                        <div className="cv-item-name-row">
                          <VegDot isVeg={item.is_veg !== false} />
                          <h3 className="cv-item-name">{item.name}</h3>
                        </div>
                        <span className="cv-item-price">{formatPrice(item.price)}</span>
                      </div>
                      {item.description && (
                        <p className="cv-item-desc">{item.description}</p>
                      )}
                      <div className="cv-item-footer">
                        <span className={`cv-cat-tag tag-${item.category?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {item.category}
                        </span>
                        {item.portion_options && item.portion_options.length > 0 && (
                          <select
                            className="cv-portion-select"
                            value={selectedPortions[item.id] || ''}
                            onChange={(e) => setSelectedPortions({ ...selectedPortions, [item.id]: e.target.value })}
                          >
                            {item.portion_options.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        )}
                        <button
                          className="cv-add-btn"
                          onClick={() => handleAddToCart(item)}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── MOBILE INLINE CART ── (replaces drawer popup) */}
          {cart.length > 0 && (
            <div className="cv-inline-cart glass-card">
              <div className="cv-inline-cart-header">
                <h3>🛒 Order Summary</h3>
                <span className="cv-inline-cart-count">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
              </div>

              <div className="cv-cart-items">
                {cart.map(cartItem => (
                  <div key={cartItem.cartItemId} className="cv-cart-item">
                    <div className="cv-cart-item-info">
                      <h4>{cartItem.item.name}</h4>
                      {cartItem.portion && <span className="cv-cart-portion">Size: {cartItem.portion}</span>}
                      <span className="cv-cart-item-price">{formatPrice(cartItem.item.price * cartItem.quantity)}</span>
                    </div>
                    <div className="cv-qty-control">
                      <button onClick={() => handleUpdateQuantity(cartItem.cartItemId, cartItem.quantity - 1)}>−</button>
                      <span>{cartItem.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(cartItem.cartItemId, cartItem.quantity + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cv-cart-summary">
                <div className="cv-cart-total-row">
                  <span>Grand Total</span>
                  <strong>{formatPrice(cartTotal)}</strong>
                </div>
                <p className="cv-cart-tax-note">Price incl. applicable taxes</p>
                <button
                  className="cv-place-order-btn"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? 'Sending Order...' : '🚀 Proceed to Pay'}
                </button>
              </div>
            </div>
          )}

        </div>{/* end cv-menu-section */}

        {/* ── DESKTOP CART SIDEBAR ── */}
        <div className="cv-cart-sidebar glass-card">
          <h2 className="cv-cart-title">🛒 Your Order</h2>
          {cart.length === 0 ? (
            <div className="cv-cart-empty">
              <span className="cv-cart-empty-icon">🛍️</span>
              <p>Your cart is empty</p>
              <span className="cv-cart-empty-sub">Add dishes from the menu!</span>
            </div>
          ) : (
            <div className="cv-cart-workspace">
              <div className="cv-cart-items">
                {cart.map(cartItem => (
                  <div key={cartItem.cartItemId} className="cv-cart-item">
                    <div className="cv-cart-item-info">
                      <h4>{cartItem.item.name}</h4>
                      {cartItem.portion && <span className="cv-cart-portion">Size: {cartItem.portion}</span>}
                      <span className="cv-cart-item-price">{formatPrice(cartItem.item.price * cartItem.quantity)}</span>
                    </div>
                    <div className="cv-qty-control">
                      <button onClick={() => handleUpdateQuantity(cartItem.cartItemId, cartItem.quantity - 1)}>−</button>
                      <span>{cartItem.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(cartItem.cartItemId, cartItem.quantity + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cv-cart-summary">
                <div className="cv-cart-total-row">
                  <span>Grand Total</span>
                  <strong>{formatPrice(cartTotal)}</strong>
                </div>
                <p className="cv-cart-tax-note">Incl. applicable taxes</p>
                <button
                  className="cv-place-order-btn"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : '🚀 Proceed to Pay'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>{/* end cv-content-area */}
    </div>
  );
}
