(function () {
  'use strict';

  /* ---- Nav active ---- */
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  /* ---- Custom cursor (hover devices only) ---- */
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover) {
    var dot  = document.createElement('div');
    var ring = document.createElement('div');
    dot.className  = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add('custom-cursor');

    var mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    });

    (function lerp() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx.toFixed(2) + 'px';
      ring.style.top  = ry.toFixed(2) + 'px';
      requestAnimationFrame(lerp);
    })();

    document.addEventListener('mouseover', function (e) {
      var target = e.target;
      if (target && typeof target.closest === 'function') {
        if (target.closest('a, button, .project-card, .exp-item, .social-link, .dpad-btn, .synth-pad, .filter-btn')) {
          document.body.classList.add('cursor-expanded');
        }
      }
    });

    document.addEventListener('mouseout', function (e) {
      var target = e.target;
      if (target && typeof target.closest === 'function') {
        if (target.closest('a, button, .project-card, .exp-item, .social-link, .dpad-btn, .synth-pad, .filter-btn')) {
          document.body.classList.remove('cursor-expanded');
        }
      }
    });

    document.addEventListener('mouseleave', function () { document.body.classList.add('cursor-hidden'); });
    document.addEventListener('mouseenter', function () { document.body.classList.remove('cursor-hidden'); });
  }

  /* ---- Scroll reveal ---- */
  var reveals = Array.from(document.querySelectorAll('.reveal'));
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.07, rootMargin: '0px 0px -20px 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in-view'); });
    }
  }

  /* ---- Card tilt + shine ---- */
  document.querySelectorAll('.project-card, .exp-item').forEach(function (card) {
    var r = null;

    card.addEventListener('mouseenter', function () {
      r = card.getBoundingClientRect();
      card.style.transition = 'box-shadow 0.3s ease, border-color 0.2s ease';
    });

    card.addEventListener('mousemove', function (e) {
      if (!r) r = card.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      card.style.setProperty('--mx', (x / r.width  * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y / r.height * 100).toFixed(1) + '%');

      if (card.classList.contains('in-view') || !card.classList.contains('reveal')) {
        var cx   = r.width  / 2;
        var cy   = r.height / 2;
        var rotX = ((y - cy) / cy) * -3.5;
        var rotY = ((x - cx) / cx) *  3.5;
        card.style.transform = 'perspective(900px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg) translateY(-3px)';
      }
    });

    card.addEventListener('mouseleave', function () {
      r = null;
      card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.2s ease';
      card.style.transform = '';
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
      setTimeout(function () { card.style.removeProperty('transition'); }, 420);
    });
  });

  /* ========================================================
     NEW INTERACTIVE SYSTEM IMPLEMENTATIONS
     ======================================================== */

  /* ---- Web Audio Synth Engine ---- */
  var audioCtx = null;
  var isMuted = localStorage.getItem('isMuted') !== 'false'; // Default to true (muted)
  var chiptuneTimer = null;
  var musicStep = 0;
  var musicPlaying = false;
  var flashIntensity = 0;

  var chiptuneNotes = [
    60, 62, 64, 67, 64, 62, 60, 0,
    64, 67, 69, 72, 69, 67, 64, 0,
    57, 59, 60, 64, 60, 59, 57, 0,
    55, 57, 59, 62, 59, 57, 55, 0
  ];

  function mtof(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function startChiptune() {
    if (chiptuneTimer) return;
    musicPlaying = true;
    musicStep = 0;
    
    chiptuneTimer = setInterval(function() {
      if (isMuted || !musicPlaying) return;
      initAudio();
      if (!audioCtx || audioCtx.state === 'suspended') return;
      
      var note = chiptuneNotes[musicStep % chiptuneNotes.length];
      musicStep++;
      if (note === 0) return;
      
      var now = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(mtof(note), now);
      
      gainNode.gain.setValueAtTime(0.012, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      
      osc.start(now);
      osc.stop(now + 0.2);
    }, 220);
  }

  function stopChiptune() {
    musicPlaying = false;
    if (chiptuneTimer) {
      clearInterval(chiptuneTimer);
      chiptuneTimer = null;
    }
  }

  function triggerVisualFlash() {
    flashIntensity = 0.22;
  }

  function playSynthSound(type) {
    if (isMuted) return;
    try {
      initAudio();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      var now = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
        gainNode.gain.setValueAtTime(0.04, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'theme') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.setValueAtTime(0.05, now + 0.07);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);

        setTimeout(function() {
          if (isMuted) return;
          var osc2 = audioCtx.createOscillator();
          var gainNode2 = audioCtx.createGain();
          osc2.connect(gainNode2);
          gainNode2.connect(audioCtx.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
          gainNode2.gain.setValueAtTime(0.05, audioCtx.currentTime);
          gainNode2.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.18);
        }, 80);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.22);
        gainNode.gain.setValueAtTime(0.04, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'gamepoint') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.45);
        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gainNode.gain.setValueAtTime(0.04, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'jump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'powerup') {
        var notes = [261.63, 329.63, 392.00, 523.25];
        osc.type = 'sine';
        gainNode.gain.setValueAtTime(0.03, now);
        notes.forEach(function(freq, index) {
          osc.frequency.setValueAtTime(freq, now + index * 0.06);
        });
        gainNode.gain.setValueAtTime(0.03, now + 0.18);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {
      console.warn("Audio Context error: ", e);
    }
  }

  function updateMuteButtons() {
    var btns = document.querySelectorAll('.sound-toggle');
    btns.forEach(function (btn) {
      if (isMuted) {
        btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.03c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
        btn.setAttribute('title', 'Unmute Sounds');
      } else {
        btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        btn.setAttribute('title', 'Mute Sounds');
      }
    });
  }

  // Register sound toggles
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.sound-toggle');
    if (btn) {
      isMuted = !isMuted;
      localStorage.setItem('isMuted', isMuted);
      updateMuteButtons();
      if (!isMuted) {
        initAudio();
        playSynthSound('success');
        startChiptune();
      } else {
        stopChiptune();
      }
    }
  });

  // Start chiptune on any interaction if unmuted
  document.addEventListener('click', function() {
    if (!isMuted && !chiptuneTimer) {
      initAudio();
      if (audioCtx && audioCtx.state !== 'suspended') {
        startChiptune();
      }
    }
  });

  // Play click sounds on menu links
  document.addEventListener('click', function(e) {
    var el = e.target.closest('a, button, .project-card, .exp-item, .filter-btn, .dpad-btn, .theme-toggle');
    if (el && !el.closest('.sound-toggle') && !el.closest('.synth-pad')) {
      playSynthSound('click');
    }
  });

  /* ---- Theme Switching Logic (Dark / Light toggle) ---- */
  var currentTheme = localStorage.getItem('theme') || 'dark';

  function applyTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    updateThemeToggleButtons();
  }

  function updateThemeToggleButtons() {
    var btns = document.querySelectorAll('.theme-toggle');
    btns.forEach(function (btn) {
      if (currentTheme === 'light') {
        btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg> Dark';
        btn.setAttribute('title', 'Switch to Dark mode');
      } else {
        btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg> Light';
        btn.setAttribute('title', 'Switch to Light mode');
      }
    });
  }

  function initThemeToggle() {
    applyTheme(currentTheme);
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-toggle');
      if (btn) {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        playSynthSound('theme');
      }
    });
  }

  // Keep backward-compat alias
  function setTheme(theme) { applyTheme(theme); }

  /* ---- Particle Background Canvas ---- */
  function initParticleBackground() {
    var canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var maxParticles = 60;
    var mouse = { x: null, y: null, radius: 140 };

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      maxParticles = Math.min(80, Math.floor((canvas.width * canvas.height) / 18000));
      initParticles();
    }

    function initParticles() {
      particles = [];
      for (var i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 2 + 1
        });
      }
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', function () {
      mouse.x = null;
      mouse.y = null;
    });

    resizeCanvas();

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#6366f1';
      
      if (flashIntensity > 0.01) {
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = flashIntensity;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flashIntensity *= 0.88;
      }
      
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.25;
        ctx.fill();

        if (mouse.x !== null) {
          var dx = p.x - mouse.x;
          var dy = p.y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = accentColor;
            ctx.globalAlpha = (1 - (dist / mouse.radius)) * 0.15;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx2 = p.x - p2.x;
          var dy2 = p.y - p2.y;
          var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = accentColor;
            ctx.globalAlpha = (1 - (dist2 / 100)) * 0.08;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---- Interactive Command Line Terminal ---- */
  var commandHistory = [];
  var historyIndex = -1;

  function initTerminal() {
    var modal = document.querySelector('.terminal-modal');
    var toggleBtns = document.querySelectorAll('.terminal-toggle');
    var closeBtn = document.querySelector('.terminal-dot.close');
    var input = document.querySelector('.terminal-input');
    var output = document.querySelector('.terminal-output');

    if (!modal || !input) return;

    function openTerminal() {
      modal.classList.add('active');
      setTimeout(function() { input.focus(); }, 100);
      playSynthSound('click');
      printWelcomeMessage();
    }

    function closeTerminal() {
      modal.classList.remove('active');
      playSynthSound('click');
    }

    toggleBtns.forEach(function (btn) {
      btn.addEventListener('click', openTerminal);
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeTerminal);
    }

    window.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        if (modal.classList.contains('active')) {
          closeTerminal();
        } else {
          openTerminal();
        }
      }
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeTerminal();
      } else if (e.target.closest('.terminal-window') && !e.target.closest('.terminal-header')) {
        input.focus();
      }
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var cmd = input.value.trim();
        input.value = '';
        if (cmd) {
          commandHistory.push(cmd);
          historyIndex = commandHistory.length;
          executeCommand(cmd);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length > 0 && historyIndex > 0) {
          historyIndex--;
          input.value = commandHistory[historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
          historyIndex++;
          input.value = commandHistory[historyIndex];
        } else if (historyIndex === commandHistory.length - 1) {
          historyIndex = commandHistory.length;
          input.value = '';
        }
      }
    });

    function printLine(text, type) {
      var div = document.createElement('div');
      div.className = 'terminal-line ' + (type || 'info');
      div.innerHTML = text;
      output.appendChild(div);
      var body = document.querySelector('.terminal-body');
      body.scrollTop = body.scrollHeight;
    }

    function printWelcomeMessage() {
      if (output.children.length > 0) return;
      printLine("=== JUNN00 PORTFOLIO MAINFRAME OS v2.0 ===", "success");
      printLine("Type <span class='help-cmd'>help</span> to view all available commands.");
      printLine("Press Ctrl + ` to toggle terminal window.\n");
    }

    function executeCommand(cmdLine) {
      printLine("junnnnnw00@portfolio:~$ " + escapeHTML(cmdLine), "info");
      playSynthSound('click');

      var parts = cmdLine.split(/\s+/);
      var command = parts[0].toLowerCase();
      var args = parts.slice(1);

      switch (command) {
        case 'help':
          printLine("Available commands:\n" +
            "  <span class='help-cmd'>about</span>       - Bio summary of Junwoo Hong\n" +
            "  <span class='help-cmd'>experience</span>  - Active risk management/AI insurance research\n" +
            "  <span class='help-cmd'>projects</span>    - Showcase developer tool portfolio\n" +
            "  <span class='help-cmd'>skills</span>      - Skills overview with visual meters\n" +
            "  <span class='help-cmd'>neofetch</span>    - Print ASCII system hardware dashboard\n" +
            "  <span class='help-cmd'>contact</span>     - Reach out information\n" +
            "  <span class='help-cmd'>theme</span>       - Toggle dark / light mode\n" +
            "  <span class='help-cmd'>snake</span>       - Launch retro Snake arcade game\n" +
            "  <span class='help-cmd'>hack</span>        - Execute POSTECH LMS infiltration simulation\n" +
            "  <span class='help-cmd'>sudo</span>        - Execute actions with administrative rights\n" +
            "  <span class='help-cmd'>clear</span>       - Clear shell log\n" +
            "  <span class='help-cmd'>exit</span>        - Close terminal window", "info");
          playSynthSound('success');
          break;

        case 'clear':
          output.innerHTML = '';
          break;

        case 'exit':
          closeTerminal();
          break;

        case 'about':
          printLine("JUNWOO HONG (junnnnnw00)\n" +
            "-------------------------\n" +
            "Undergraduate student at POSTECH studying Computer Science.\n" +
            "Mainly building tools to automate repetitive tasks and reduce friction\n" +
            "in everyday academic workflows.\n" +
            "Interests: DevTools, macOS/Swift, LLM integration, study automation.", "success");
          playSynthSound('success');
          break;

        case 'experience':
          printLine("RESEARCH & COMPETITION:\n" +
            "-----------------------\n" +
            "4th National University Student Risk Management Insight & Insur-novation Competition\n" +
            "Topic: 'Liability Risk Assessment Model for AI Service Insurers'\n" +
            "Period: 2026.04 - Present [In Progress]\n" +
            "Developing ML risk models for underwriting decisions.", "success");
          playSynthSound('success');
          break;

        case 'projects':
          printLine("FEATURED PROJECTS:\n" +
            "------------------\n" +
            "1. AutoMail       [Swift]  - Native macOS AI school mail categorizer.\n" +
            "2. altToNotes     [Python] - Gemini AI-powered voice lecture slides note taker.\n" +
            "3. plms2Calendar  [Python] - POSTECH PLMS assignment to Google Calendar sync.\n" +
            "4. plmsDownloader [Python] - Bulk PLMS study materials downloader tool.\n" +
            "5. alt2obsidian   [TS]     - Obsidian plugin concepts extraction.\n" +
            "Type 'snake' to play the retro game!", "success");
          playSynthSound('success');
          break;

        case 'skills':
          printLine("<b>DEVELOPER TECH SPECS & SKILLS:</b>\n" +
            "-----------------------------------\n" +
            "Python/ML    [██████████████░░░░░] 75%  - Risk Modeling, AltToNotes\n" +
            "Swift/macOS  [████████████░░░░░░░] 60%  - AutoMail AI macOS Client\n" +
            "JavaScript   [██████████████░░░░░] 70%  - Custom WebAudio Synths\n" +
            "C / C++      [██████████░░░░░░░░░] 50%  - Systems Programming\n" +
            "Git / Unix   [████████████████░░░] 80%  - Command line wizardry\n\n" +
            "<i>Special Skill: Coding web portfolios with 0% bugs.</i>", "success");
          playSynthSound('success');
          break;

        case 'neofetch':
        case 'sysinfo':
          printLine(
            "<pre style='font-family: inherit; margin: 0; line-height: 1.2; color: var(--color-accent);'>" +
            "   /\\_/\\      <span style='color: var(--color-text); font-weight: 700;'>junnnnnw00@mainframe</span>\n" +
            "  ( o.o )     --------------------\n" +
            "   > ^ <      OS: POSTECH Mainframe OS v2.0\n" +
            "              Host: Apple M-Max Developer Rig\n" +
            "              Kernel: Antigravity-Zsh-v2.0\n" +
            "              Uptime: 4 hours, 20 mins\n" +
            "              Shell: JunwooShell v1.0.3\n" +
            "              CPU: Silicon M4 Neural Engine\n" +
            "              Memory: 8192 MB / 16384 MB (50%)\n" +
            "              Activity: Writing UI without bugs\n" +
            "</pre>", "info"
          );
          playSynthSound('success');
          break;

        case 'contact':
          printLine("CONTACT LINKS:\n" +
            "--------------\n" +
            "Email:  godjunwoo2006@gmail.com / jwhong@postech.ac.kr\n" +
            "Github: github.com/junnnnnw00", "success");
          playSynthSound('success');
          break;

        case 'theme':
          var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          applyTheme(newTheme);
          printLine('Theme switched to: ' + newTheme, 'success');
          playSynthSound('theme');
          break;

        case 'snake':
          closeTerminal();
          setTimeout(function() {
            var arcadeModal = document.querySelector('.arcade-modal');
            if (arcadeModal) {
              arcadeModal.classList.add('active');
              startArcadeGame();
            }
          }, 300);
          break;

        case 'hack':
          playSynthSound('success');
          (function() {
            var seq = [
              ['', 0],
              ['┌─ OPERATION: PLMS INFILTRATION ──────────────┐', 60, 'success'],
              ['', 100],
              ['[1/5] RECON   Scanning postech.ac.kr ...', 200],
              ['      Ports: 22/ssh  80/http  8080/plms', 900],
              ['      Target: plms.postech.ac.kr  ✓', 1500, 'success'],
              ['', 1600],
              ['[2/5] AUTH    Loading creds (48,291 entries) ...', 1700],
              ['      Attempt 9182: lms_admin:admin@2024!', 2600],
              ['      ✓ ACCESS GRANTED', 3500, 'success'],
              ['', 3600],
              ['[3/5] SHELL   root@plms-backend-01 $', 3700, 'success'],
              ['', 3800],
              ['[4/5] EXFIL   Dumping grades DB ...', 3900],
              ['      [████████████░░░░] 75%  CS101_midterm.pdf', 4700],
              ['      [████████████████] 100% grades_3847.json  ✓', 5300, 'success'],
              ['', 5400],
              ['[5/5] CLEAN   auth.log patched. History cleared.  ✓', 5500, 'success'],
              ['', 5900],
              ['└─ COMPLETE — no forensic trace. Enjoy the A+. ──┘', 6000, 'success'],
            ];
            seq.forEach(function(item) {
              setTimeout(function() { printLine(item[0], item[2] || 'info'); }, item[1]);
            });
          })();
          break;

        case 'sudo':
          if (args.length === 0) {
            printLine("sudo: usage: sudo [command] (try 'sudo hack' or 'sudo overclock')", "error");
            playSynthSound('error');
          } else {
            var action = args.join(' ').toLowerCase();
            if (action === 'hack') {
              printLine("SUDO PRIVILEGES GRANTED. ESCALATING...", "error");
              playSynthSound('success');
              setTimeout(function() {
                var seq = [
                  ['[root] Executing at max privilege...', 0, 'error'],
                  ['[1/5] RECON   Target: plms.postech.ac.kr  ✓', 400, 'success'],
                  ['[2/5] AUTH    lms_admin:admin@2024!  ✓  ACCESS GRANTED', 900, 'success'],
                  ['[3/5] SHELL   root@plms-backend-01 $  connected', 1300, 'success'],
                  ['[4/5] EXFIL   [████████████████] 100%  grades_3847.json ✓', 1700, 'success'],
                  ['[5/5] CLEAN   auth.log patched  ✓', 2100, 'success'],
                  ['', 2500],
                  ['└─ COMPLETE — root makes this embarrassingly easy. ──┘', 2600, 'success'],
                ];
                seq.forEach(function(item) {
                  setTimeout(function() { printLine(item[0], item[2] || 'info'); }, item[1]);
                });
              }, 300);
            } else if (action === 'overclock') {
              printLine("OVERCLOCKING CPU... ACCELERATING SYNTH CLOCK...", "error");
              playSynthSound('powerup');
              triggerVisualFlash();
              setTimeout(function() {
                printLine("CPU OVERCLOCKED. WARNING: CAFFEINE LEVEL EXCEEDS SAFE LIMITS.", "success");
              }, 500);
            } else {
              printLine("sudo: " + escapeHTML(action) + ": command not found or permission denied.", "error");
              playSynthSound('error');
            }
          }
          break;

        default:
          printLine("Command not found: '" + escapeHTML(command) + "'. Type 'help' for instructions.", "error");
          playSynthSound('error');
      }
    }

    function escapeHTML(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }

  /* ---- Retro Arcade Game Cabinet ---- */
  var snake = [];
  var food = { x: 0, y: 0 };
  var dx = 1;
  var dy = 0;
  var score = 0;
  var highScore = 0;
  var gameInterval = null;
  var gameRunning = false;
  var gameCanvas = null;
  var gameCtx = null;
  var gridSize = 15;
  var cellSize = 20;

  var arcadeState = 'menu'; // 'menu', 'snake', 'dodger'
  var selectedGame = 'snake'; // 'snake' or 'dodger'
  
  // Dodger-specific state
  var playerX = 7;
  var playerY = 14;
  var dodgerItems = [];
  var spawnRate = 0.12;

  function drawArcadeMenu() {
    if (!gameCtx || !gameCanvas) return;
    gameCtx.fillStyle = '#000';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#6366f1';

    // Title
    gameCtx.font = '700 18px "JetBrains Mono", monospace';
    gameCtx.fillStyle = accentColor;
    gameCtx.textAlign = 'center';
    gameCtx.fillText("SELECT GAME", gameCanvas.width / 2, 70);

    // Options
    gameCtx.font = '500 14px "JetBrains Mono", monospace';
    
    // Snake option
    gameCtx.fillStyle = (selectedGame === 'snake') ? '#fff' : '#444';
    var prefix1 = (selectedGame === 'snake') ? '> ' : '  ';
    gameCtx.fillText(prefix1 + "SNAKE ARCADE", gameCanvas.width / 2, 130);

    // Dodger option
    gameCtx.fillStyle = (selectedGame === 'dodger') ? '#fff' : '#444';
    var prefix2 = (selectedGame === 'dodger') ? '> ' : '  ';
    gameCtx.fillText(prefix2 + "F-GRADE DODGER", gameCanvas.width / 2, 160);

    // Help instructions
    gameCtx.font = '400 10px "JetBrains Mono", monospace';
    gameCtx.fillStyle = '#666';
    gameCtx.fillText("Use UP/DOWN Arrows to Select", gameCanvas.width / 2, 220);
    gameCtx.fillText("Press START (or ENTER) to Play", gameCanvas.width / 2, 240);
  }

  function startArcadeGame() {
    gameCanvas = document.getElementById('arcade-canvas');
    if (!gameCanvas) return;
    gameCtx = gameCanvas.getContext('2d');

    gameCanvas.width = gridSize * cellSize;
    gameCanvas.height = gridSize * cellSize;

    arcadeState = 'menu';
    gameRunning = false;
    clearInterval(gameInterval);
    drawArcadeMenu();
    playSynthSound('success');
  }

  function startSnakeGame() {
    arcadeState = 'snake';
    snake = [
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    gameRunning = true;

    highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
    var scoreVal = document.getElementById('arcade-score-val');
    var highVal = document.getElementById('arcade-high-val');
    if (scoreVal) scoreVal.innerText = score;
    if (highVal) highVal.innerText = highScore;

    placeFood();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameStep, 110);

    playSynthSound('success');
  }

  function startDodgerGame() {
    arcadeState = 'dodger';
    playerX = 7;
    dodgerItems = [];
    score = 0;
    gameRunning = true;
    spawnRate = 0.12;

    highScore = parseInt(localStorage.getItem('dodgerHighScore') || '0', 10);
    var scoreVal = document.getElementById('arcade-score-val');
    var highVal = document.getElementById('arcade-high-val');
    if (scoreVal) scoreVal.innerText = score;
    if (highVal) highVal.innerText = highScore;

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameStep, 100);

    playSynthSound('success');
  }

  function placeFood() {
    var valid = false;
    while (!valid) {
      food.x = Math.floor(Math.random() * gridSize);
      food.y = Math.floor(Math.random() * gridSize);
      valid = true;
      for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === food.x && snake[i].y === food.y) {
          valid = false;
          break;
        }
      }
    }
  }

  function gameStep() {
    if (!gameRunning) return;
    if (arcadeState === 'snake') {
      moveSnake();
      checkCollisions();
      drawGame();
    } else if (arcadeState === 'dodger') {
      updateDodger();
      drawDodger();
    }
  }

  function moveSnake() {
    var head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      var scoreVal = document.getElementById('arcade-score-val');
      if (scoreVal) scoreVal.innerText = score;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        var highVal = document.getElementById('arcade-high-val');
        if (highVal) highVal.innerText = highScore;
      }
      playSynthSound('gamepoint');
      placeFood();
    } else {
      snake.pop();
    }
  }

  function checkCollisions() {
    var head = snake[0];
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
      endSnakeGame();
      return;
    }
    for (var i = 1; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        endSnakeGame();
        return;
      }
    }
  }

  function endSnakeGame() {
    gameRunning = false;
    clearInterval(gameInterval);
    playSynthSound('gameover');
    
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#6366f1';
    gameCtx.font = '700 20px "JetBrains Mono", monospace';
    gameCtx.fillStyle = accentColor;
    gameCtx.textAlign = 'center';
    gameCtx.fillText("GAME OVER", gameCanvas.width / 2, gameCanvas.height / 2 - 10);

    gameCtx.font = '400 12px "JetBrains Mono", monospace';
    gameCtx.fillStyle = '#fff';
    gameCtx.fillText("Score: " + score + " | High: " + highScore, gameCanvas.width / 2, gameCanvas.height / 2 + 15);
    gameCtx.fillText("Press START to try again", gameCanvas.width / 2, gameCanvas.height / 2 + 35);
  }

  function drawGame() {
    gameCtx.fillStyle = '#000';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#6366f1';

    gameCtx.strokeStyle = '#111';
    gameCtx.lineWidth = 0.5;
    for (var i = 0; i <= gridSize; i++) {
      gameCtx.beginPath();
      gameCtx.moveTo(i * cellSize, 0);
      gameCtx.lineTo(i * cellSize, gameCanvas.height);
      gameCtx.stroke();

      gameCtx.beginPath();
      gameCtx.moveTo(0, i * cellSize);
      gameCtx.lineTo(gameCanvas.width, i * cellSize);
      gameCtx.stroke();
    }

    for (var s = 0; s < snake.length; s++) {
      var segment = snake[s];
      gameCtx.fillStyle = (s === 0) ? accentColor : '#fff';
      
      if (s === 0) {
        gameCtx.shadowBlur = 8;
        gameCtx.shadowColor = accentColor;
      } else {
        gameCtx.shadowBlur = 0;
      }
      
      gameCtx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
    }
    gameCtx.shadowBlur = 0;

    gameCtx.fillStyle = '#ff5f56';
    gameCtx.shadowBlur = 10;
    gameCtx.shadowColor = '#ff5f56';
    gameCtx.beginPath();
    gameCtx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 3,
      0,
      Math.PI * 2
    );
    gameCtx.fill();
    gameCtx.shadowBlur = 0;
  }

  // Dodger functions
  function updateDodger() {
    for (var i = 0; i < dodgerItems.length; i++) {
      var item = dodgerItems[i];
      item.y += item.speed;
    }

    for (var i = dodgerItems.length - 1; i >= 0; i--) {
      var item = dodgerItems[i];
      if (item.y >= 13.2 && item.y <= 14.5) {
        var col = Math.round(item.x);
        if (col === playerX) {
          if (item.type === 'bad') {
            endDodgerGame();
            return;
          } else {
            score += 15;
            var scoreVal = document.getElementById('arcade-score-val');
            if (scoreVal) scoreVal.innerText = score;
            
            var highVal = document.getElementById('arcade-high-val');
            if (score > highScore) {
              highScore = score;
              localStorage.setItem('dodgerHighScore', highScore);
              if (highVal) highVal.innerText = highScore;
            }
            playSynthSound('coin');
            dodgerItems.splice(i, 1);
            continue;
          }
        }
      }
      
      if (item.y > 15) {
        dodgerItems.splice(i, 1);
      }
    }

    if (Math.random() < spawnRate + (score / 1500)) {
      var types = ['bad', 'bad', 'good'];
      var type = types[Math.floor(Math.random() * types.length)];
      var label = '';
      if (type === 'bad') {
        var labels = ['F', 'HW', 'EXAM'];
        label = labels[Math.floor(Math.random() * labels.length)];
      } else {
        var labels = ['A+', '☕', '🎓'];
        label = labels[Math.floor(Math.random() * labels.length)];
      }
      
      dodgerItems.push({
        x: Math.floor(Math.random() * gridSize),
        y: 0,
        type: type,
        label: label,
        speed: 0.5 + Math.random() * 0.4
      });
    }
  }

  function drawDodger() {
    if (!gameCtx || !gameCanvas) return;
    gameCtx.fillStyle = '#000';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    gameCtx.strokeStyle = '#111';
    gameCtx.lineWidth = 0.5;
    for (var i = 0; i <= gridSize; i++) {
      gameCtx.beginPath();
      gameCtx.moveTo(i * cellSize, 0);
      gameCtx.lineTo(i * cellSize, gameCanvas.height);
      gameCtx.stroke();
    }

    gameCtx.font = '700 13px "JetBrains Mono", monospace';
    gameCtx.textAlign = 'center';
    for (var i = 0; i < dodgerItems.length; i++) {
      var item = dodgerItems[i];
      if (item.type === 'bad') {
        gameCtx.fillStyle = '#ff5f56';
      } else {
        gameCtx.fillStyle = '#22c55e';
      }
      gameCtx.fillText(item.label, item.x * cellSize + cellSize / 2, item.y * cellSize + 12);
    }

    gameCtx.fillStyle = '#00ffcc';
    gameCtx.shadowBlur = 8;
    gameCtx.shadowColor = '#00ffcc';
    gameCtx.font = '700 16px "JetBrains Mono", monospace';
    gameCtx.textAlign = 'center';
    gameCtx.fillText("👨‍💻", playerX * cellSize + cellSize / 2, playerY * cellSize + 15);
    gameCtx.shadowBlur = 0;
  }

  function endDodgerGame() {
    gameRunning = false;
    clearInterval(gameInterval);
    playSynthSound('gameover');

    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#6366f1';
    gameCtx.font = '700 18px "JetBrains Mono", monospace';
    gameCtx.fillStyle = accentColor;
    gameCtx.textAlign = 'center';
    gameCtx.fillText("ACADEMIC PROBATION", gameCanvas.width / 2, gameCanvas.height / 2 - 10);

    gameCtx.font = '400 12px "JetBrains Mono", monospace';
    gameCtx.fillStyle = '#fff';
    gameCtx.fillText("Score: " + score + " | High: " + highScore, gameCanvas.width / 2, gameCanvas.height / 2 + 15);
    gameCtx.fillText("Press START to try again", gameCanvas.width / 2, gameCanvas.height / 2 + 35);
  }

  // Key and virtual controls listeners
  window.addEventListener('keydown', function(e) {
    var modal = document.querySelector('.arcade-modal');
    if (!modal || !modal.classList.contains('active')) return;

    if (!gameRunning) {
      if (arcadeState === 'menu') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          selectedGame = 'snake';
          drawArcadeMenu();
          playSynthSound('click');
          e.preventDefault();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          selectedGame = 'dodger';
          drawArcadeMenu();
          playSynthSound('click');
          e.preventDefault();
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (selectedGame === 'snake') startSnakeGame();
          else startDodgerGame();
          e.preventDefault();
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          arcadeState = 'menu';
          drawArcadeMenu();
          playSynthSound('click');
          e.preventDefault();
        }
      }
      return;
    }

    if (arcadeState === 'snake') {
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (dy !== 1) { dx = 0; dy = -1; e.preventDefault(); playSynthSound('click'); }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (dy !== -1) { dx = 0; dy = 1; e.preventDefault(); playSynthSound('click'); }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (dx !== 1) { dx = -1; dy = 0; e.preventDefault(); playSynthSound('click'); }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (dx !== -1) { dx = 1; dy = 0; e.preventDefault(); playSynthSound('click'); }
          break;
      }
    } else if (arcadeState === 'dodger') {
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          playerX = Math.max(0, playerX - 1);
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          playerX = Math.min(gridSize - 1, playerX + 1);
          e.preventDefault();
          break;
      }
    }
  });

  function initArcadeControls() {
    var modal = document.querySelector('.arcade-modal');
    var closeBtns = document.querySelectorAll('.arcade-modal .btn-close');
    var startBtn = document.getElementById('btn-arcade-start');

    if (!modal) return;

    closeBtns.forEach(function (btn) {
      btn.addEventListener('click', function() {
        modal.classList.remove('active');
        gameRunning = false;
        clearInterval(gameInterval);
        playSynthSound('click');
      });
    });

    if (startBtn) {
      startBtn.addEventListener('click', function() {
        if (arcadeState === 'menu') {
          if (selectedGame === 'snake') startSnakeGame();
          else startDodgerGame();
        } else if (!gameRunning) {
          arcadeState = 'menu';
          drawArcadeMenu();
          playSynthSound('click');
        }
      });
    }

    var arcadeToggleBtns = document.querySelectorAll('.arcade-toggle');
    arcadeToggleBtns.forEach(function (btn) {
      btn.addEventListener('click', function() {
        modal.classList.add('active');
        startArcadeGame();
      });
    });

    document.addEventListener('click', function (e) {
      var dBtn = e.target.closest('.dpad-btn');
      if (dBtn) {
        playSynthSound('click');
        if (arcadeState === 'menu') {
          if (dBtn.classList.contains('dpad-up')) {
            selectedGame = 'snake';
            drawArcadeMenu();
          } else if (dBtn.classList.contains('dpad-down')) {
            selectedGame = 'dodger';
            drawArcadeMenu();
          }
          return;
        }

        if (!gameRunning) {
          arcadeState = 'menu';
          drawArcadeMenu();
          return;
        }

        if (arcadeState === 'snake') {
          if (dBtn.classList.contains('dpad-up') && dy !== 1) { dx = 0; dy = -1; }
          else if (dBtn.classList.contains('dpad-down') && dy !== -1) { dx = 0; dy = 1; }
          else if (dBtn.classList.contains('dpad-left') && dx !== 1) { dx = -1; dy = 0; }
          else if (dBtn.classList.contains('dpad-right') && dx !== -1) { dx = 1; dy = 0; }
        } else if (arcadeState === 'dodger') {
          if (dBtn.classList.contains('dpad-left')) { playerX = Math.max(0, playerX - 1); }
          else if (dBtn.classList.contains('dpad-right')) { playerX = Math.min(gridSize - 1, playerX + 1); }
        }
      }
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        gameRunning = false;
        clearInterval(gameInterval);
        playSynthSound('click');
      }
    });
  }

  /* ---- Dev Card Caffeine Ticker ---- */
  function initDevCard() {
    var valEl = document.getElementById('caffeine-val');
    var fillEl = document.querySelector('.dev-caffeine-fill');
    if (!valEl || !fillEl) return;
    setInterval(function() {
      var v = parseInt(valEl.textContent, 10);
      var next = Math.max(72, Math.min(99, v + (Math.random() > 0.5 ? 1 : -1)));
      valEl.textContent = next + '%';
      fillEl.style.setProperty('--pct', next + '%');
    }, 4000);
  }


  /* ---- Projects Filtering Logic ---- */
  function initProjectFilters() {
    var filterContainer = document.querySelector('.project-filters');
    var cards = document.querySelectorAll('.project-card');
    if (!filterContainer || cards.length === 0) return;

    // Collect tags dynamically
    var tags = ['ALL'];
    cards.forEach(function (card) {
      card.querySelectorAll('.tag').forEach(function (t) {
        var txt = t.innerText.toUpperCase().trim();
        if (tags.indexOf(txt) === -1) {
          tags.push(txt);
        }
      });
    });

    // Generate filter buttons
    filterContainer.innerHTML = '';
    tags.forEach(function (tag) {
      var btn = document.createElement('button');
      btn.className = 'filter-btn' + (tag === 'ALL' ? ' active' : '');
      btn.innerText = tag;
      btn.addEventListener('click', function () {
        filterContainer.querySelectorAll('.filter-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        filterProjects(tag);
      });
      filterContainer.appendChild(btn);
    });

    function filterProjects(tag) {
      cards.forEach(function (card) {
        if (tag === 'ALL') {
          card.classList.remove('hidden');
          return;
        }
        var matches = false;
        card.querySelectorAll('.tag').forEach(function (t) {
          if (t.innerText.toUpperCase().trim() === tag) {
            matches = true;
          }
        });
        if (matches) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }
  }

  /* ---- Initialization ---- */
  function initAll() {
    updateMuteButtons();
    updateThemeToggleButtons();
    initThemeToggle();
    initParticleBackground();
    initTerminal();
    initArcadeControls();
    initProjectFilters();
    initDevCard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();
