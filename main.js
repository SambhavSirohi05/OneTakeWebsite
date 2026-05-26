document.addEventListener('DOMContentLoaded', () => {
  setupTeleprompter();
  setupCameraBubble();
  setupCursorSpotlight();
  setupSubtitles();
  setupCopyButtons();
  setupNavbarActiveLinks();
});

/* ── 1. INTERACTIVE TELEPROMPTER ── */
function setupTeleprompter() {
  const container = document.getElementById('teleScrollContainer');
  const speedSlider = document.getElementById('teleSpeedSlider');
  const speedVal = document.getElementById('teleSpeedVal');
  const scrollBadge = document.getElementById('teleScrollBadge');
  const btnFontPlus = document.getElementById('teleOptFontPlus');
  const btnFontMinus = document.getElementById('teleOptFontMinus');
  const btnOpacityPlus = document.getElementById('teleOptOpacityPlus');
  const btnOpacityMinus = document.getElementById('teleOptOpacityMinus');
  
  if (!container) return;

  let speed = parseInt(speedSlider.value, 10); // pixels per second
  let scrollY = 0;
  let isScrolling = true;
  let lastTime = null;
  let fontSize = 16; // in pt
  let opacity = 82; // in percentage

  // Animation Loop
  function scrollLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (isScrolling && speed > 0) {
      scrollY += speed * delta;
      
      const scrollHeight = container.scrollHeight;
      const parentHeight = container.parentElement.clientHeight;
      
      // Reset if it scrolls past the fade out zone
      if (scrollY > scrollHeight - parentHeight + 30) {
        scrollY = -50; // Give a small buffer at the top
      }
      
      container.style.transform = `translateY(${-scrollY}px)`;
    }

    requestAnimationFrame(scrollLoop);
  }
  
  requestAnimationFrame(scrollLoop);

  // Speed Slider Control
  speedSlider.addEventListener('input', (e) => {
    speed = parseInt(e.target.value, 10);
    speedVal.textContent = speed + 'px/s';
    
    if (speed === 0) {
      isScrolling = false;
      scrollBadge.textContent = 'paused';
      scrollBadge.style.background = 'rgba(255,255,255,0.06)';
      scrollBadge.style.color = 'rgba(255,255,255,0.4)';
    } else {
      isScrolling = true;
      scrollBadge.textContent = 'scrolling';
      scrollBadge.style.background = 'rgba(181,114,42,0.12)';
      scrollBadge.style.color = '#d4924a';
    }
  });

  // Font Size Controls
  btnFontPlus.addEventListener('click', () => {
    if (fontSize < 24) {
      fontSize += 2;
      updateTextStyles();
    }
  });

  btnFontMinus.addEventListener('click', () => {
    if (fontSize > 12) {
      fontSize -= 2;
      updateTextStyles();
    }
  });

  // Opacity Controls
  btnOpacityPlus.addEventListener('click', () => {
    if (opacity < 100) {
      opacity += 10;
      updateTextStyles();
    }
  });

  btnOpacityMinus.addEventListener('click', () => {
    if (opacity > 30) {
      opacity -= 10;
      updateTextStyles();
    }
  });

  function updateTextStyles() {
    const lines = container.querySelectorAll('.v-tele-line');
    lines.forEach(line => {
      line.style.fontSize = fontSize + 'px';
    });
    container.parentElement.style.opacity = opacity / 100;
  }
}

/* ── 2. INTERACTIVE CAMERA BUBBLE ── */
function setupCameraBubble() {
  const bubble = document.getElementById('demoCamBubble');
  const buttons = document.querySelectorAll('[data-cam-pos]');
  const shapeButtons = document.querySelectorAll('[data-cam-shape]');
  
  if (!bubble) return;

  // Position Buttons
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from other position buttons
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const pos = btn.getAttribute('data-cam-pos');
      
      // Clear old classes
      bubble.classList.remove('top-left', 'top-right', 'bottom-left', 'bottom-right');
      bubble.classList.add(pos);
    });
  });

  // Shape Buttons
  shapeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      shapeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const shape = btn.getAttribute('data-cam-shape');
      if (shape === 'rect') {
        bubble.classList.add('rect');
      } else {
        bubble.classList.remove('rect');
      }
    });
  });
}

/* ── 3. INTERACTIVE CURSOR SPOTLIGHT ── */
function setupCursorSpotlight() {
  const screen = document.getElementById('cursorScreen');
  const dot = document.getElementById('cursorDot');
  const pane = document.getElementById('cursorPane');
  const badgeZoom = document.getElementById('cursorBadgeZoom');
  const badgeState = document.getElementById('cursorBadgeState');
  const ringsContainer = document.getElementById('cursorRings');
  
  if (!screen) return;

  let zoomActive = false;
  let suppressionActive = false;
  let targetX = 50;
  let targetY = 50;
  let currentX = 50;
  let currentY = 50;

  // Move dot & handle cursor spotlight hover alignment
  screen.addEventListener('mousemove', (e) => {
    const rect = screen.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Smooth easing target
    targetX = x;
    targetY = y;
  });

  // Click to trigger spotlight zoom effect
  screen.addEventListener('click', (e) => {
    if (suppressionActive) return; // Suppressed during startup mock

    const rect = screen.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Create ripple effect rings
    triggerRings(x, y);

    zoomActive = !zoomActive;

    if (zoomActive) {
      badgeZoom.textContent = '1.8x zoom';
      badgeState.textContent = 'focus locked';
      badgeZoom.style.background = 'rgba(181,114,42,0.2)';
      badgeZoom.style.color = '#d4924a';
      
      // Magnification translation towards spotlight center
      pane.style.transform = `scale(1.6) translate(${50 - x}%, ${50 - y}%)`;
    } else {
      badgeZoom.textContent = '1.0x (normal)';
      badgeState.textContent = 'idle 0.5s';
      badgeZoom.style.background = 'rgba(255,255,255,0.04)';
      badgeZoom.style.color = 'rgba(255,255,255,0.3)';
      
      pane.style.transform = `scale(1) translate(0, 0)`;
    }
  });

  // Dot position interpolation
  function updateDot() {
    currentX += (targetX - currentX) * 0.15;
    currentY += (targetY - currentY) * 0.15;
    
    dot.style.left = currentX + '%';
    dot.style.top = currentY + '%';
    
    requestAnimationFrame(updateDot);
  }
  updateDot();

  function triggerRings(x, y) {
    // Clear old rings
    ringsContainer.innerHTML = '';
    ringsContainer.style.left = x + '%';
    ringsContainer.style.top = y + '%';
    
    const r1 = document.createElement('div');
    r1.className = 'vc-ring vc-r1 vc-ring-expand';
    const r2 = document.createElement('div');
    r2.className = 'vc-ring vc-r2 vc-ring-expand';
    r2.style.animationDelay = '0.3s';
    
    ringsContainer.appendChild(r1);
    ringsContainer.appendChild(r2);
  }

  // Simulate 4s suppression buffer on load
  suppressionActive = true;
  badgeState.textContent = 'suppressing (4s)';
  badgeState.style.color = 'var(--red)';
  
  setTimeout(() => {
    suppressionActive = false;
    badgeState.textContent = 'idle 0.5s';
    badgeState.style.color = 'rgba(255,255,255,0.3)';
  }, 4000);
}

/* ── 4. INTERACTIVE AI SUBTITLES ── */
function setupSubtitles() {
  const words = document.querySelectorAll('.v-sub-bar .sw');
  const modePills = document.querySelectorAll('[data-sub-mode]');
  const colorPills = document.querySelectorAll('[data-sub-color]');
  
  if (words.length === 0) return;

  let activeColor = 'yellow'; // yellow, white, cyan, green
  let activeMode = 'word'; // word, segment
  let currentWordIndex = 0;
  let wordTimer = null;

  // Active word rotation loop
  function startWordCycle() {
    stopWordCycle();
    
    wordTimer = setInterval(() => {
      // Clear highlights from all words
      words.forEach(w => {
        w.className = 'sw';
      });

      if (activeMode === 'word') {
        // Highlight word by word
        words[currentWordIndex].classList.add(`highlight-${activeColor}`);
        currentWordIndex = (currentWordIndex + 1) % words.length;
      } else {
        // Highlight all words together (Segment style)
        words.forEach(w => w.classList.add(`highlight-${activeColor}`));
      }
    }, activeMode === 'word' ? 380 : 1200);
  }

  function stopWordCycle() {
    if (wordTimer) clearInterval(wordTimer);
  }

  // Init
  startWordCycle();

  // Mode Buttons (Word-by-word vs Segment)
  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      modePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      activeMode = pill.getAttribute('data-sub-mode');
      currentWordIndex = 0;
      
      // Quick clean up
      words.forEach(w => w.className = 'sw');
      
      startWordCycle();
    });
  });

  // Color Buttons
  colorPills.forEach(pill => {
    pill.addEventListener('click', () => {
      colorPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      activeColor = pill.getAttribute('data-sub-color');
      
      // Update words directly
      if (activeMode === 'segment') {
        words.forEach(w => {
          w.className = 'sw';
          w.classList.add(`highlight-${activeColor}`);
        });
      } else {
        words.forEach((w, idx) => {
          if (w.classList.contains('highlight-white') ||
              w.classList.contains('highlight-yellow') ||
              w.classList.contains('highlight-cyan') ||
              w.classList.contains('highlight-green')) {
            w.className = 'sw';
            w.classList.add(`highlight-${activeColor}`);
          }
        });
      }
    });
  });
}

/* ── 5. CODE COPY CLIPBOARD ── */
function setupCopyButtons() {
  const copyButtons = document.querySelectorAll('[data-copy-target]');
  
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const targetTextElement = document.getElementById(targetId);
      
      if (!targetTextElement) return;
      
      const textToCopy = targetTextElement.textContent.trim();
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        btn.classList.add('copied');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    });
  });
}

/* ── 6. NAVBAR ACTIVE LINKS ── */
function setupNavbarActiveLinks() {
  const sections = document.querySelectorAll('section, div[id]');
  const navLinks = document.querySelectorAll('.nav-right .nav-a');
  
  if (sections.length === 0 || navLinks.length === 0) return;

  // Simple active nav links highlighting on scroll
  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= (sectionTop - 120)) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href && href.includes(current) && current !== '') {
        link.classList.add('active');
      }
    });
  });
}
