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

    document.querySelectorAll('a, button, .project-card, .exp-item, .social-link').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-expanded'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-expanded'); });
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

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
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
      }
    }
  });

  // Play click sounds on menu links
  document.querySelectorAll('a, button, .project-card, .exp-item, .filter-btn, .dpad-btn, .theme-select').forEach(function (el) {
    el.addEventListener('click', function() {
      playSynthSound('click');
    });
  });

  /* ---- Theme Switching Logic ---- */
  var currentTheme = localStorage.getItem('theme') || 'default';
  if (currentTheme !== 'default') {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }

  function initThemeSelectors() {
    var selectors = document.querySelectorAll('.theme-select');
    selectors.forEach(function (select) {
      select.value = currentTheme;
      select.addEventListener('change', function (e) {
        setTheme(e.target.value);
      });
    });
  }

  function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    document.querySelectorAll('.theme-select').forEach(function (select) {
      select.value = theme;
    });
    playSynthSound('theme');
  }

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
      
      var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#f0175f';
      
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
            "  <span class='help-cmd'>experience</span>  - Active risk management/AI insurance research details\n" +
            "  <span class='help-cmd'>projects</span>    - Showcase developer tool portfolio\n" +
            "  <span class='help-cmd'>contact</span>     - Reach out information\n" +
            "  <span class='help-cmd'>theme [t]</span>   - Set theme: default, matrix, nord, vaporwave\n" +
            "  <span class='help-cmd'>snake</span>       - Launch retro Snake arcade game\n" +
            "  <span class='help-cmd'>hack</span>        - Execute POSTECH LMS security simulation\n" +
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

        case 'contact':
          printLine("CONTACT LINKS:\n" +
            "--------------\n" +
            "Email:  godjunwoo2006@gmail.com / jwhong@postech.ac.kr\n" +
            "Github: github.com/junnnnnw00", "success");
          playSynthSound('success');
          break;

        case 'theme':
          if (args.length === 0) {
            printLine("Usage: theme [default | matrix | nord | vaporwave]", "error");
            playSynthSound('error');
            break;
          }
          var targetTheme = args[0].toLowerCase();
          if (['default', 'matrix', 'nord', 'vaporwave'].indexOf(targetTheme) !== -1) {
            setTheme(targetTheme);
            printLine("Theme changed to " + targetTheme, "success");
          } else {
            printLine("Unknown theme: " + targetTheme + ". Choose: default, matrix, nord, vaporwave", "error");
            playSynthSound('error');
          }
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
          closeTerminal();
          setTimeout(runMatrixHackingSimulation, 300);
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

  /* ---- Retro Snake Arcade Game ---- */
  var snake = [];
  var food = { x: 0, y: 0 };
  var dx = 1;
  var dy = 0;
  var score = 0;
  var highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
  var gameInterval = null;
  var gameRunning = false;
  var gameCanvas = null;
  var gameCtx = null;
  var gridSize = 15;
  var cellSize = 20;

  function startArcadeGame() {
    gameCanvas = document.getElementById('arcade-canvas');
    if (!gameCanvas) return;
    gameCtx = gameCanvas.getContext('2d');

    gameCanvas.width = gridSize * cellSize;
    gameCanvas.height = gridSize * cellSize;

    snake = [
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    gameRunning = true;

    var scoreVal = document.getElementById('arcade-score-val');
    var highVal = document.getElementById('arcade-high-val');
    if (scoreVal) scoreVal.innerText = score;
    if (highVal) highVal.innerText = highScore;

    placeFood();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameStep, 110);

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
    moveSnake();
    checkCollisions();
    drawGame();
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
      endGame();
      return;
    }
    for (var i = 1; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        endGame();
        return;
      }
    }
  }

  function endGame() {
    gameRunning = false;
    clearInterval(gameInterval);
    playSynthSound('gameover');
    
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#f0175f';
    gameCtx.font = '700 20px "JetBrains Mono", monospace';
    gameCtx.fillStyle = accentColor;
    gameCtx.textAlign = 'center';
    gameCtx.fillText("GAME OVER", gameCanvas.width / 2, gameCanvas.height / 2 - 10);

    gameCtx.font = '400 12px "JetBrains Mono", monospace';
    gameCtx.fillStyle = '#fff';
    gameCtx.fillText("Score: " + score + " | High: " + highScore, gameCanvas.width / 2, gameCanvas.height / 2 + 15);
    gameCtx.fillText("Press START to Play Again", gameCanvas.width / 2, gameCanvas.height / 2 + 35);
  }

  function drawGame() {
    gameCtx.fillStyle = '#000';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#f0175f';

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

  window.addEventListener('keydown', function(e) {
    if (!gameRunning) return;
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
        startArcadeGame();
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
      if (!gameRunning) return;
      var dBtn = e.target.closest('.dpad-btn');
      if (dBtn) {
        playSynthSound('click');
        if (dBtn.classList.contains('dpad-up') && dy !== 1) { dx = 0; dy = -1; }
        else if (dBtn.classList.contains('dpad-down') && dy !== -1) { dx = 0; dy = 1; }
        else if (dBtn.classList.contains('dpad-left') && dx !== 1) { dx = -1; dy = 0; }
        else if (dBtn.classList.contains('dpad-right') && dx !== -1) { dx = 1; dy = 0; }
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

  /* ---- Matrix Hacking simulation ---- */
  function runMatrixHackingSimulation() {
    var overlay = document.querySelector('.matrix-overlay');
    var canvas = document.getElementById('matrix-canvas');
    var bar = document.querySelector('.hack-bar');
    var statusText = document.querySelector('.hack-status-text');

    if (!overlay || !canvas || !bar) return;

    overlay.classList.add('active');
    playSynthSound('error');

    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var columns = Math.floor(canvas.width / 14);
    var ypos = [];
    for (var i = 0; i < columns; i++) {
      ypos[i] = Math.random() * -100;
    }

    var chars = "010101ABCDEFGHIJKLMNOPQRSTUVWXYZｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
    var loopId = null;

    function drawMatrix() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#f0175f';
      ctx.fillStyle = accentColor;
      ctx.font = '14px monospace';

      for (var col = 0; col < columns; col++) {
        var char = chars[Math.floor(Math.random() * chars.length)];
        var x = col * 14;
        var y = ypos[col];
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          ypos[col] = 0;
        } else {
          ypos[col] += 14;
        }
      }
    }

    loopId = setInterval(drawMatrix, 35);

    var progress = 0;
    var phrases = [
      "Accessing POSTECH PLMS Database...",
      "Bypassing Admin Authentication...",
      "Extracting Exam Solutions...",
      "Injecting Artificial Intelligence...",
      "Connection secured! HACK COMPLETE."
    ];

    var textInterval = setInterval(function() {
      var phraseIdx = Math.floor((progress / 100) * (phrases.length - 1));
      if (statusText) statusText.innerText = phrases[phraseIdx];
    }, 600);

    var progressInterval = setInterval(function() {
      progress += Math.floor(Math.random() * 8) + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        clearInterval(textInterval);
        if (statusText) statusText.innerText = "SUCCESS: mainframe hacked!";
        setTimeout(function() {
          clearInterval(loopId);
          overlay.classList.remove('active');
          playSynthSound('success');
          
          var termModal = document.querySelector('.terminal-modal');
          if (termModal) {
            termModal.classList.add('active');
            var out = document.querySelector('.terminal-output');
            if (out) {
              var line = document.createElement('div');
              line.className = 'terminal-line success';
              line.innerHTML = "\n[SYSTEM INTRUSION SUCCESSFUL]\nDecrypted database keys extracted. High-grade AI notes successfully generated.";
              out.appendChild(line);
              var body = document.querySelector('.terminal-body');
              body.scrollTop = body.scrollHeight;
            }
          }
        }, 1000);
      }
      if (bar) bar.style.width = progress + '%';
    }, 150);
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
  document.addEventListener('DOMContentLoaded', function () {
    updateMuteButtons();
    initThemeSelectors();
    initParticleBackground();
    initTerminal();
    initArcadeControls();
    initProjectFilters();
  });

  // Fallback in case DOMContentLoaded already fired
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    updateMuteButtons();
    initThemeSelectors();
    initParticleBackground();
    initTerminal();
    initArcadeControls();
    initProjectFilters();
  }

})();
