document.addEventListener('DOMContentLoaded', () => {
  const init = (name, fn) => {
    try {
      fn();
    } catch (e) {
      console.error(`Error initializing ${name}:`, e);
    }
  };

  init('Teleprompter', setupTeleprompter);
  init('CameraBubble', setupCameraBubble);
  init('CursorSpotlight', setupCursorSpotlight);
  init('Subtitles', setupSubtitles);
  init('PresentationCanvas', setupPresentationCanvas);
  init('CopyButtons', setupCopyButtons);
  init('NavbarActiveLinks', setupNavbarActiveLinks);
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
  const sizeSlider = document.getElementById('camSizeSlider');
  const sizeVal = document.getElementById('camSizeVal');
  
  if (!bubble) return;

  // Size Slider Control
  if (sizeSlider && sizeVal) {
    sizeSlider.addEventListener('input', (e) => {
      const size = e.target.value;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.fontSize = `${size * 0.32}px`;
      sizeVal.textContent = `${size}px`;
    });
    
    // Initial sync
    const initSize = sizeSlider.value;
    bubble.style.width = `${initSize}px`;
    bubble.style.height = `${initSize}px`;
    bubble.style.fontSize = `${initSize * 0.32}px`;
  }

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

/* ── 7. INTERACTIVE PRESENTATION CANVAS ── */
function setupPresentationCanvas() {
  const preview = document.getElementById('canvasPreview');
  const inner = document.getElementById('canvasInner');
  const bgButtons = document.querySelectorAll('[data-canvas-bg]');
  
  const padSlider = document.getElementById('canvasPaddingSlider');
  const padVal = document.getElementById('canvasPaddingVal');
  const cornerSlider = document.getElementById('canvasCornersSlider');
  const cornerVal = document.getElementById('canvasCornersVal');
  const shadowSlider = document.getElementById('canvasShadowSlider');
  const shadowVal = document.getElementById('canvasShadowVal');
  
  if (!preview || !inner || !padSlider || !cornerSlider || !shadowSlider) return;
  
  // Background Buttons
  bgButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      bgButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const bgType = btn.getAttribute('data-canvas-bg');
      preview.className = 'v-canvas-preview'; // Reset classes
      preview.classList.add(`bg-${bgType}`);
      
      if (parseInt(padSlider.value, 10) === 0) {
        preview.classList.add('padding-zero');
      }
    });
  });
  
  // Padding Slider
  padSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (val === 0) {
      preview.classList.add('padding-zero');
      inner.style.top = '0';
      inner.style.left = '0';
      inner.style.right = '0';
      inner.style.bottom = '0';
      inner.style.borderRadius = '12px';
    } else {
      preview.classList.remove('padding-zero');
      inner.style.top = `${val}%`;
      inner.style.left = `${val}%`;
      inner.style.right = `${val}%`;
      inner.style.bottom = `${val}%`;
      inner.style.borderRadius = `${cornerSlider.value}px`;
    }
    padVal.textContent = `${val}%`;
  });
  
  // Corners Slider
  cornerSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    if (parseInt(padSlider.value, 10) !== 0) {
      inner.style.borderRadius = `${val}px`;
    }
    cornerVal.textContent = `${val}px`;
  });
  
  // Shadow Slider
  shadowSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    inner.style.boxShadow = `0 ${val/2}px ${val}px rgba(0, 0, 0, 0.45)`;
    shadowVal.textContent = `${val}px`;
  });
  
  // Run initial updates to sync values
  const initPadding = parseInt(padSlider.value, 10);
  if (initPadding === 0) {
    preview.classList.add('padding-zero');
    inner.style.top = '0';
    inner.style.left = '0';
    inner.style.right = '0';
    inner.style.bottom = '0';
    inner.style.borderRadius = '12px';
  } else {
    preview.classList.remove('padding-zero');
    inner.style.top = `${initPadding}%`;
    inner.style.left = `${initPadding}%`;
    inner.style.right = `${initPadding}%`;
    inner.style.bottom = `${initPadding}%`;
    inner.style.borderRadius = `${cornerSlider.value}px`;
  }
  inner.style.boxShadow = `0 ${shadowSlider.value/2}px ${shadowSlider.value}px rgba(0, 0, 0, 0.45)`;
}
