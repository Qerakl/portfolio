(function () {
  "use strict";

  var canvas = document.getElementById("mini-game-canvas");
  var section = document.getElementById("play");
  var reducedNote = document.getElementById("mini-game-reduced-note");
  var scoreEl = document.getElementById("mini-game-score");
  var btnStart = document.getElementById("mini-game-start");
  var btnPause = document.getElementById("mini-game-pause");
  var btnRetry = document.getElementById("mini-game-retry");

  if (!canvas || !section) return;

  var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reduceMotionMq.matches) {
    section.classList.add("mini-game--reduced-motion");
    if (reducedNote) reducedNote.hidden = false;
    return;
  }

  var ctx = canvas.getContext("2d");
  var W = 360;
  var H = 480;

  var state = "idle";
  var rafId = null;
  var lastTime = 0;
  var player = { x: W / 2 - 24, y: H - 40, w: 48, h: 16 };
  var meteors = [];
  var score = 0;
  var spawnAcc = 0;
  var keys = { left: false, right: false };

  function resizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function setScoreDisplay(v) {
    score = v;
    if (scoreEl) scoreEl.textContent = String(Math.floor(score));
  }

  function spawnMeteor() {
    var size = 18 + Math.random() * 22;
    meteors.push({
      x: Math.random() * (W - size),
      y: -size - 4,
      w: size,
      h: size,
      vy: 2.4 + Math.random() * 3.2 + Math.min(score * 0.0018, 2.2),
    });
  }

  function resetRound() {
    meteors = [];
    player.x = W / 2 - player.w / 2;
    spawnAcc = 0;
    setScoreDisplay(0);
    lastTime = 0;
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function stopLoop() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function draw() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0c1020");
    g.addColorStop(1, "#05070f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(148, 163, 184, 0.28)";
    for (var s = 0; s < 48; s++) {
      var sx = (s * 73 + 11) % W;
      var sy = (s * 41 + 19) % H;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    meteors.forEach(function (m) {
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(167, 139, 250, 0.55)";
      ctx.fill();
      ctx.strokeStyle = "rgba(46, 231, 243, 0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.fillStyle = "rgba(79, 143, 255, 0.92)";
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(46, 231, 243, 0.75)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (state === "gameover") {
      ctx.fillStyle = "rgba(3, 5, 12, 0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = "600 22px Outfit, system-ui, sans-serif";
      ctx.fillStyle = "#f1f5f9";
      ctx.textAlign = "center";
      ctx.fillText("Столкновение", W / 2, H / 2 - 8);
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("Нажми «Ещё раз»", W / 2, H / 2 + 18);
    } else if (state === "paused") {
      ctx.fillStyle = "rgba(3, 5, 12, 0.45)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = "600 20px Outfit, system-ui, sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.textAlign = "center";
      ctx.fillText("Пауза", W / 2, H / 2);
    }
  }

  function update(dt) {
    var move = 260 * (dt / 1000);
    if (keys.left) player.x -= move;
    if (keys.right) player.x += move;
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    spawnAcc += dt;
    var interval = Math.max(380, 1050 - score * 0.45);
    if (spawnAcc >= interval) {
      spawnAcc = 0;
      spawnMeteor();
    }

    for (var i = meteors.length - 1; i >= 0; i--) {
      var m = meteors[i];
      m.y += m.vy * (dt / 16.67);
      if (m.y > H + 40) {
        meteors.splice(i, 1);
        setScoreDisplay(score + 12);
        continue;
      }
      if (aabb(player, m)) {
        state = "gameover";
        stopLoop();
        btnPause.disabled = true;
        btnPause.textContent = "Пауза";
        btnRetry.hidden = false;
        draw();
        return;
      }
    }

    setScoreDisplay(score + dt * 0.028);
  }

  function loop(ts) {
    rafId = null;
    if (state !== "playing") return;
    if (!lastTime) lastTime = ts;
    var dt = Math.min(ts - lastTime, 56);
    lastTime = ts;
    update(dt);
    draw();
    if (state === "playing") {
      rafId = requestAnimationFrame(loop);
    }
  }

  function startLoop() {
    stopLoop();
    lastTime = 0;
    rafId = requestAnimationFrame(loop);
  }

  if (btnStart) {
    btnStart.addEventListener("click", function () {
      stopLoop();
      resetRound();
      state = "playing";
      btnPause.disabled = false;
      btnPause.textContent = "Пауза";
      btnRetry.hidden = true;
      btnStart.textContent = "Заново";
      startLoop();
    });
  }

  if (btnPause) {
    btnPause.addEventListener("click", function () {
      if (state === "gameover") return;
      if (state === "playing") {
        state = "paused";
        stopLoop();
        btnPause.textContent = "Продолжить";
        draw();
      } else if (state === "paused") {
        state = "playing";
        btnPause.textContent = "Пауза";
        startLoop();
      }
    });
  }

  if (btnRetry) {
    btnRetry.addEventListener("click", function () {
      resetRound();
      state = "playing";
      btnRetry.hidden = true;
      btnPause.disabled = false;
      btnPause.textContent = "Пауза";
      btnStart.textContent = "Заново";
      startLoop();
    });
  }

  window.addEventListener(
    "keydown",
    function (e) {
      if (state !== "playing") return;
      if (e.code === "ArrowLeft") {
        keys.left = true;
        e.preventDefault();
      } else if (e.code === "ArrowRight") {
        keys.right = true;
        e.preventDefault();
      }
    },
    true
  );

  window.addEventListener(
    "keyup",
    function (e) {
      if (e.code === "ArrowLeft") keys.left = false;
      if (e.code === "ArrowRight") keys.right = false;
    },
    true
  );

  function pointerToPlayerX(clientX) {
    var rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    var scale = W / rect.width;
    var x = (clientX - rect.left) * scale - player.w / 2;
    player.x = Math.max(0, Math.min(W - player.w, x));
  }

  canvas.addEventListener(
    "touchstart",
    function (e) {
      if (state !== "playing") return;
      pointerToPlayerX(e.touches[0].clientX);
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    function (e) {
      if (state !== "playing") return;
      e.preventDefault();
      pointerToPlayerX(e.touches[0].clientX);
    },
    { passive: false }
  );

  draw();
})();
