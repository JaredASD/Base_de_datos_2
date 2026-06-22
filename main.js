/* ================================================================
   PORTAFOLIO BD II — GLOBAL JAVASCRIPT
   Modo base: RETRO ARCADE | Modo alt: HACKER/MATRIX
================================================================ */

/* ================================================================
   UTILS
================================================================ */
const R  = (a,b) => Math.random() * (b-a) + a;
const RI = (a,b) => Math.floor(R(a,b));
const HX = "0123456789ABCDEF";
const MATRIX_CHARS = "01アイウエオカキ$#@ABCDEF";

const toH2 = n => '0x' + n.toString(16).toUpperCase().padStart(2,'0');
const toH4 = n => '0x' + n.toString(16).toUpperCase().padStart(4,'0');
const toH8 = n => '0x' + n.toString(16).toUpperCase().padStart(8,'0');

/* ================================================================
   STATE
================================================================ */
let isHacker = false;
let audioCtx  = null;
let score     = 0;

/* ================================================================
   DOM READY
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initStars();
    initParticles();
    initStreams();
    initCursor();
    startHexClock();
    initBarAnimations();
    checkSavedMode();

    // Stars visible immediately in gaming mode
    const cStars = document.getElementById('c-stars');
    if (cStars) cStars.style.opacity = '1';
});

/* ================================================================
   HEX CLOCK
================================================================ */
function startHexClock() {
    const el = document.getElementById('hx-clock');
    if (!el) return;
    function tick() {
        const n = new Date(), u = Math.floor(Date.now()/1000);
        const t = el.querySelector('.hxc-time');
        const d = document.getElementById('hxc-date');
        const e = document.getElementById('hxc-epoch');
        if (t) t.textContent = `${toH2(n.getHours())}:${toH2(n.getMinutes())}:${toH2(n.getSeconds())}`;
        if (d) d.textContent = `${toH2(n.getDate())}/${toH2(n.getMonth()+1)}/${toH4(n.getFullYear())}`;
        if (e) e.textContent = `UNIX: ${toH8(u)}`;
    }
    tick();
    setInterval(tick, 1000);
}

/* ================================================================
   CANVAS: PIXEL STARFIELD — gaming mode
================================================================ */
function initStars() {
    const canvas = document.getElementById('c-stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const stars = [];
    const LAYERS = 3; // parallax layers

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        buildStars();
    }

    function buildStars() {
        stars.length = 0;
        for (let l = 0; l < LAYERS; l++) {
            const count = 60 + l * 40;
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: R(0, canvas.width),
                    y: R(0, canvas.height),
                    size: R(0.8, 1.5 + l * 0.8),
                    speed: 0.1 + l * 0.12,
                    twinkleSpeed: R(0.5, 2.5),
                    twinkleOffset: R(0, Math.PI * 2),
                    layer: l,
                    color: ['#ffffff','#ffd60a','#049cd8','#43b047'][RI(0,4)]
                });
            }
        }
    }

    // Pixel clouds (retro decorative)
    const clouds = Array.from({length: 4}, () => ({
        x: R(0, canvas.width),
        y: R(60, canvas.height * 0.35),
        w: RI(60, 140), speed: R(0.2, 0.6),
        color: `rgba(255,255,255,${R(0.03,0.07)})`
    }));

    function drawPixelCloud(c, cx, cy) {
        const pw = Math.floor(c.w / 8);
        // Simple pixel cloud shape
        const shape = [
            [0,1,0,0,0,0,0,0],
            [1,1,1,0,0,0,1,0],
            [1,1,1,1,0,1,1,1],
            [0,1,1,1,1,1,1,0],
        ];
        shape.forEach((row, ry) => {
            row.forEach((cell, rx) => {
                if (cell) {
                    ctx.fillRect(Math.floor(cx + rx*pw), Math.floor(cy + ry*pw), pw, pw);
                }
            });
        });
    }

    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw stars
        const t = Date.now() / 1000;
        stars.forEach(s => {
            const tw = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
            ctx.globalAlpha = 0.3 + tw * 0.7;
            ctx.fillStyle = s.color;
            // Pixel star (square for retro look)
            const px = Math.floor(s.size);
            ctx.fillRect(Math.floor(s.x), Math.floor(s.y), px, px);
            // Drift slowly
            s.y += s.speed * 0.08;
            if (s.y > canvas.height) {
                s.y = 0;
                s.x = R(0, canvas.width);
            }
        });

        // Draw pixel clouds
        clouds.forEach(cl => {
            ctx.globalAlpha = 1;
            ctx.fillStyle = cl.color;
            drawPixelCloud(cl, cl.x, cl.y);
            cl.x -= cl.speed;
            if (cl.x < -cl.w) cl.x = canvas.width + cl.w;
        });

        ctx.globalAlpha = 1;
        frame++;
        requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
}

/* ================================================================
   CANVAS: MATRIX RAIN — hacker mode
================================================================ */
let matrixCanvas, matrixCtx, matrixDrops = [];

function initMatrix() {
    matrixCanvas = document.getElementById('c-matrix');
    if (!matrixCanvas) return;
    matrixCtx = matrixCanvas.getContext('2d');

    function resize() {
        matrixCanvas.width  = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        matrixDrops = Array(Math.floor(matrixCanvas.width / 15)).fill(1);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
        if (!isHacker) return;
        matrixCtx.fillStyle = 'rgba(0,0,0,0.05)';
        matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        matrixCtx.font = '14px Fira Code';
        matrixDrops.forEach((d, i) => {
            const ch = MATRIX_CHARS[RI(0, MATRIX_CHARS.length)];
            const bright = Math.random() > 0.95;
            matrixCtx.fillStyle = bright ? '#ffffff' : '#00ff41';
            matrixCtx.shadowColor = '#00ff41';
            matrixCtx.shadowBlur  = bright ? 8 : 0;
            matrixCtx.fillText(ch, i * 15, d * 15);
            matrixCtx.shadowBlur = 0;
            if (d * 15 > matrixCanvas.height && Math.random() > 0.975) matrixDrops[i] = 0;
            matrixDrops[i]++;
        });
    }
    setInterval(draw, 45);
}

/* ================================================================
   CANVAS: PERSPECTIVE GRID — hacker mode
================================================================ */
let gridCanvas, gridCtx, gridOffset = 0;

function initGrid() {
    gridCanvas = document.getElementById('c-grid');
    if (!gridCanvas) return;
    gridCtx = gridCanvas.getContext('2d');

    function resize() {
        gridCanvas.width  = window.innerWidth;
        gridCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
        if (!isHacker) return;
        gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
        const W = gridCanvas.width, H = gridCanvas.height;
        const vx = W/2, vy = H * 0.52;
        gridCtx.shadowColor = '#00ff41';
        gridCtx.shadowBlur  = 3;
        for (let i = 0; i < 20; i++) {
            const t = ((i/20) + gridOffset) % 1;
            const e = t * t;
            const y  = vy + (H - vy) * e;
            const sp = W * 1.6 * e;
            const a  = e * 0.28;
            gridCtx.strokeStyle = `rgba(0,255,65,${a})`;
            gridCtx.lineWidth   = 0.8;
            gridCtx.beginPath();
            gridCtx.moveTo(vx - sp/2, y);
            gridCtx.lineTo(vx + sp/2, y);
            gridCtx.stroke();
        }
        for (let i = -18; i <= 18; i++) {
            const x0 = vx + i * (W/18) * 0.5;
            gridCtx.strokeStyle = `rgba(0,255,65,${0.05 + Math.abs(i)/(18*12)})`;
            gridCtx.beginPath();
            gridCtx.moveTo(x0, vy);
            gridCtx.lineTo(vx + (x0 - vx) * 3, H + 100);
            gridCtx.stroke();
        }
        gridCtx.shadowBlur = 0;
        gridOffset = (gridOffset + 0.003) % 1;
    }
    setInterval(draw, 38);
}

/* ================================================================
   CANVAS: PIXEL PARTICLES — floating coins/stars (gaming)
================================================================ */
let partCanvas, partCtx, particles = [];

function initParticles() {
    partCanvas = document.getElementById('c-particles');
    if (!partCanvas) return;
    partCtx = partCanvas.getContext('2d');

    const EMOJIS = ['★','●','♦','★','●'];
    const COLORS  = ['#ffd60a','#e52521','#049cd8','#43b047','#f89c2a'];

    function resize() {
        partCanvas.width  = window.innerWidth;
        partCanvas.height = window.innerHeight;
        buildParticles();
    }

    function buildParticles() {
        particles = Array.from({length: 35}, () => makeParticle());
    }

    function makeParticle() {
        return {
            x: R(0, window.innerWidth),
            y: R(0, window.innerHeight),
            vx: R(-0.3, 0.3),
            vy: R(-0.5, -0.08),
            size: RI(6, 12),
            color: COLORS[RI(0, COLORS.length)],
            char: EMOJIS[RI(0, EMOJIS.length)],
            life: R(0,1), maxLife: R(4,10),
            spin: R(-0.05, 0.05), angle: R(0, Math.PI*2),
            isHacker: false
        };
    }

    function makeHackerParticle() {
        return {
            x: R(0, window.innerWidth),
            y: R(0, window.innerHeight),
            vx: R(-0.4, 0.4), vy: R(-0.6, -0.1),
            size: 9,
            color: Math.random() > 0.9 ? '#00b8ff' : '#00ff41',
            char: HX[RI(0,16)] + HX[RI(0,16)],
            life: R(0,1), maxLife: R(3,8),
            spin: 0, angle: 0, isHacker: true
        };
    }

    function draw() {
        partCtx.clearRect(0, 0, partCanvas.width, partCanvas.height);
        partCtx.font = 'bold 10px "Press Start 2P"';
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.life += 0.016; p.angle += p.spin;
            const fade = Math.sin((p.life / p.maxLife) * Math.PI);
            partCtx.globalAlpha = fade * 0.75;
            partCtx.save();
            partCtx.translate(Math.floor(p.x), Math.floor(p.y));
            if (!p.isHacker) partCtx.rotate(p.angle);
            partCtx.fillStyle = p.color;
            partCtx.shadowColor = p.color;
            partCtx.shadowBlur  = p.isHacker ? 4 : 0;
            if (p.isHacker) {
                partCtx.font = '9px Fira Code';
                partCtx.fillText(p.char, 0, 0);
            } else {
                partCtx.font = `${p.size}px "Press Start 2P"`;
                partCtx.fillText(p.char, 0, 0);
            }
            partCtx.shadowBlur = 0;
            partCtx.restore();
            if (p.life >= p.maxLife || p.y < -30) {
                particles[i] = isHacker ? makeHackerParticle() : makeParticle();
            }
        });
        partCtx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
}

/* ================================================================
   DATA STREAMS — hacker sidebar
================================================================ */
function initStreams() {
    ['dsL','dsR'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        setInterval(() => {
            let s = '';
            for (let i = 0; i < RI(4,10); i++) s += HX[RI(0,16)];
            const sp = document.createElement('span');
            sp.style.setProperty('--dur', R(2,5)+'s');
            sp.style.setProperty('--del', R(0,1.5)+'s');
            sp.textContent = s;
            el.appendChild(sp);
            if (el.children.length > 35) el.removeChild(el.firstChild);
        }, 200);
    });
}

/* ================================================================
   CUSTOM CURSOR — hacker mode
================================================================ */
function initCursor() {
    const ring = document.getElementById('hk-cursor');
    const dot  = document.getElementById('hk-dot');
    if (!ring || !dot) return;

    let cx=0,cy=0,rx=0,ry=0;

    document.addEventListener('mousemove', e => {
        cx = e.clientX; cy = e.clientY;
        dot.style.left = cx+'px'; dot.style.top = cy+'px';
        if (isHacker) spawnTrail(cx, cy);
    });

    (function lerp() {
        rx += (cx-rx)*0.14; ry += (cy-ry)*0.14;
        ring.style.left = rx+'px'; ring.style.top = ry+'px';
        requestAnimationFrame(lerp);
    })();

    document.querySelectorAll('button, label, a, .role-card').forEach(el => {
        el.addEventListener('mouseenter', () => {
            ring.style.width = ring.style.height = '28px';
            ring.style.borderColor = '#00b8ff';
        });
        el.addEventListener('mouseleave', () => {
            ring.style.width = ring.style.height = '14px';
            ring.style.borderColor = '#00ff41';
        });
    });
}

function spawnTrail(x, y) {
    const t = document.createElement('div');
    t.className = 'hk-trail';
    t.style.left = x+'px'; t.style.top = y+'px';
    const s = RI(2,6)+'px'; t.style.width = s; t.style.height = s;
    t.style.boxShadow = '0 0 5px #00ff41';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 600);
}

/* ================================================================
   WEB AUDIO — 8-BIT SOUNDS
================================================================ */
function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playNote(freq, dur, type='square', vol=0.06, detune=0) {
    try {
        const ac = getAudioCtx();
        const o  = ac.createOscillator();
        const g  = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = type; o.frequency.value = freq;
        o.detune.value = detune;
        g.gain.setValueAtTime(vol, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
        o.start(); o.stop(ac.currentTime + dur);
    } catch(e) {}
}

// Classic Mario coin sound
function playCoin() {
    playNote(988,  0.08, 'square', 0.07);
    setTimeout(() => playNote(1319, 0.12, 'square', 0.06), 80);
}

// Mario jump sound
function playJump() {
    const ac = getAudioCtx();
    try {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = 'square'; o.frequency.value = 400;
        o.frequency.exponentialRampToValueAtTime(900, ac.currentTime + 0.12);
        g.gain.setValueAtTime(0.07, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
        o.start(); o.stop(ac.currentTime + 0.18);
    } catch(e) {}
}

// Power-up sound (entering hacker mode)
function playPowerUp() {
    const notes = [523,659,784,1047];
    notes.forEach((f, i) => setTimeout(() => playNote(f, 0.12, 'square', 0.06), i*90));
    setTimeout(() => playNote(1319, 0.25, 'sawtooth', 0.05), 380);
}

// 1-UP sound
function play1Up() {
    const notes = [783,1047,1319,1047,1319,1568];
    notes.forEach((f, i) => setTimeout(() => playNote(f, 0.09, 'square', 0.06), i*70));
}

// Game over / mode off
function playGameOver() {
    const notes = [523,440,349,262];
    notes.forEach((f, i) => setTimeout(() => playNote(f, 0.15, 'square', 0.06), i*100));
}

// Hacker keyclick
function playClick() {
    playNote(800 + RI(0,200), 0.04, 'square', 0.025);
}

// Access / warp pipe sound
function playWarp() {
    const ac = getAudioCtx();
    try {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(400, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(100, ac.currentTime + 0.4);
        g.gain.setValueAtTime(0.07, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45);
        o.start(); o.stop(ac.currentTime + 0.45);
    } catch(e) {}
}

/* ================================================================
   SCORE SYSTEM
================================================================ */
function addScore(pts, x, y) {
    score += pts;
    const el = document.getElementById('score-display');
    if (el) el.textContent = String(score).padStart(6, '0');
    // Floating score popup
    if (x && y) {
        const pop = document.createElement('div');
        pop.className = 'score-pop';
        pop.textContent = '+' + pts;
        pop.style.left = x + 'px';
        pop.style.top  = y + 'px';
        document.body.appendChild(pop);
        setTimeout(() => pop.remove(), 1200);
    }
}

/* ================================================================
   ACHIEVEMENT TOAST
================================================================ */
function showAchievement(icon, title, name, delay=500) {
    setTimeout(() => {
        const el = document.getElementById('achievement');
        if (!el) return;
        el.querySelector('.achievement-icon').textContent = icon;
        el.querySelector('.achievement-title').textContent = title;
        el.querySelector('.achievement-name').textContent  = name;
        el.classList.add('show');
        el.style.animation = 'none';
        el.offsetHeight; // reflow
        el.style.animation = '';
        playCoin();
        setTimeout(() => el.classList.remove('show'), 4000);
    }, delay);
}

/* ================================================================
   BAR ANIMATIONS (fill on load / mode change)
================================================================ */
function initBarAnimations() {
    setTimeout(() => {
        document.querySelectorAll('.pixel-bar-fill[data-width]').forEach(bar => {
            bar.style.width = bar.dataset.width + '%';
        });
    }, 600);
}

/* ================================================================
   GLITCH DECRYPT — hacker text effect
================================================================ */
function glitchDecrypt(el, finalText, dur=800) {
    const chars = "ABCDEF0123456789#@%$!?[]{}|<>";
    let start = null;
    function step(ts) {
        if (!start) start = ts;
        const prog  = Math.min((ts - start) / dur, 1);
        const reveal = Math.floor(prog * finalText.length);
        let out = '';
        for (let i = 0; i < finalText.length; i++) {
            out += i < reveal
                ? finalText[i]
                : (finalText[i] === ' ' ? ' ' : chars[RI(0, chars.length)]);
        }
        el.textContent = out;
        if (prog < 1) requestAnimationFrame(step);
        else el.textContent = finalText;
    }
    requestAnimationFrame(step);
}

/* ================================================================
   HACK OVERLAY RUNNER
================================================================ */
const HACK_LOGS = [
    { t:'> Initializing secure channel...', c:'l-info' },
    { t:'> RSA-4096 handshake... [OK]',     c:'l-ok'   },
    { t:'> Scanning database schema...',    c:''        },
    { t:'> ACID compliance: VERIFIED',      c:'l-ok'   },
    { t:'> Mounting encrypted volume...',   c:'l-info'  },
    { t:'> Privilege check: SUPERUSER',     c:'l-warn'  },
    { t:'> Tunnel established',             c:''        },
    { t:'> ACCESS GRANTED ✓',              c:'l-ok'   },
];

function runHackOverlay(callback) {
    const ov    = document.getElementById('hack-overlay');
    const fill  = document.getElementById('ho-fill');
    const pct   = document.getElementById('ho-pct');
    const lines = document.getElementById('ho-lines');
    if (!ov) { callback(); return; }
    ov.classList.add('active');
    lines.innerHTML = '';
    let progress = 0;
    const iv = setInterval(() => {
        progress = Math.min(progress + RI(3,9), 100);
        fill.style.width = progress + '%';
        pct.textContent  = progress + '%';
        playClick();
        if (progress >= 100) { clearInterval(iv); setTimeout(callback, 350); }
    }, 65);
    HACK_LOGS.forEach((log, i) => setTimeout(() => {
        const d = document.createElement('div');
        d.className = log.c; d.textContent = log.t;
        lines.appendChild(d);
        playNote(400 + i*80, 0.04, 'square', 0.03);
    }, i * 230));
}

/* ================================================================
   APPLY MODE TOGGLE
================================================================ */
function applyMode() {
    const toggle = document.getElementById('mode-toggle');
    if (!toggle) return;
    isHacker = toggle.checked;

    // Sync any floating hacker-toggle buttons (icon/text/checked state)
    syncHackerButtons();

    // Screen shake
    document.body.classList.add('shaking');
    setTimeout(() => document.body.classList.remove('shaking'), 500);

    const cStars  = document.getElementById('c-stars');
    const cMatrix = document.getElementById('c-matrix');
    const cGrid   = document.getElementById('c-grid');
    const cPart   = document.getElementById('c-particles');
    const logCon  = document.getElementById('log-console');
    const logLines = document.getElementById('log-lines');

    if (isHacker) {
        /* ── ENTER HACKER MODE ── */
        playPowerUp();
        document.body.classList.add('hacker-mode');
        if (cStars)  cStars.style.opacity  = '0';
        if (cMatrix) { initMatrix(); cMatrix.style.opacity = '0.18'; }
        if (cGrid)   { initGrid();   cGrid.style.opacity   = '1'; }
        if (cPart)   cPart.style.opacity = '1';
        localStorage.setItem('visualMode', 'hacker');

        // Swap particles to hacker style
        particles.forEach((p, i) => { particles[i].isHacker = true; });

        // Decrypt text
        setTimeout(() => {
            document.querySelectorAll('[data-decrypt]').forEach(el => {
                glitchDecrypt(el, el.dataset.decrypt, R(600,900));
            });
            document.querySelectorAll('.role-lbl').forEach(el => {
                setTimeout(() => glitchDecrypt(el, el.dataset.text, 600), RI(150,400));
            });
        }, 200);

        // Log console
        if (logCon)  logCon.style.display = 'block';
        if (logLines) logLines.innerHTML = '';
        const logs = [
            {t:'> Connecting to SQL Server (Port 1433)...', c:'l-info'},
            {t:'> AUTH_TOKEN accepted. Session opened.',    c:'l-ok'  },
            {t:'> B-Tree index scan: COMPLETE',             c:'l-ok'  },
            {t:'> ACID compliance... [OK]',                 c:'l-ok'  },
            {t:'> WARNING: 3 unindexed FK constraints',     c:'l-warn'},
            {t:'> Query optimizer: enabled',                c:''      },
            {t:'> Deadlock monitor: listening...',          c:'l-dim' },
            {t:'> PRIVILEGE ESCALATION: ROOT_GRANTED',      c:'l-err' },
            {t:'> ACCESS_GRANTED → JARED_CORE_v2.6',        c:'l-ok'  },
        ];
        logs.forEach((log, i) => setTimeout(() => {
            if (!logLines) return;
            const d = document.createElement('div');
            d.className = log.c; d.textContent = log.t;
            logLines.appendChild(d);
            logLines.scrollTop = logLines.scrollHeight;
        }, i * 360));

        // Sound on hover pills
        document.querySelectorAll('[data-sound-hover]').forEach(el =>
            el.addEventListener('mouseenter', playClick));

    } else {
        /* ── EXIT HACKER MODE ── */
        playGameOver();
        document.body.classList.remove('hacker-mode');
        if (cStars)  cStars.style.opacity  = '1';
        if (cMatrix) cMatrix.style.opacity = '0';
        if (cGrid)   cGrid.style.opacity   = '0';
        if (cPart)   cPart.style.opacity   = '1';
        if (logCon)  logCon.style.display  = 'none';
        localStorage.setItem('visualMode', 'normal');

        // Restore particles
        particles.forEach((p, i) => { particles[i].isHacker = false; });

        // Restore texts
        document.querySelectorAll('[data-decrypt]').forEach(el => {
            el.textContent = el.dataset.decrypt;
        });
        document.querySelectorAll('.role-lbl').forEach(el => {
            el.textContent = el.dataset.text;
        });
    }
}

/* ================================================================
   HACKER TOGGLE BUTTON (big floating FAB) — helpers
================================================================ */
function toggleHackerMode() {
    const toggle = document.getElementById('mode-toggle');
    if (!toggle) return;
    toggle.checked = !toggle.checked;
    applyMode();
}
function syncHackerButtons() {
    document.querySelectorAll('.hacker-toggle').forEach(btn => {
        const label = btn.querySelector('.ht-label');
        const icon  = btn.querySelector('.ht-icon');
        if (isHacker) {
            if (label) label.textContent = 'DEEP_WEB: ON';
            if (icon)  icon.textContent = '🟢';
            btn.setAttribute('aria-pressed', 'true');
        } else {
            if (label) label.textContent = 'MODO HACKER';
            if (icon)  icon.textContent = '💀';
            btn.setAttribute('aria-pressed', 'false');
        }
    });
}

/* ================================================================
   PERSIST MODE ON LOAD
================================================================ */
function checkSavedMode() {
    if (localStorage.getItem('visualMode') === 'hacker') {
        const toggle = document.getElementById('mode-toggle');
        if (toggle) { toggle.checked = true; applyMode(); }
    } else {
        syncHackerButtons();
    }
}

/* ================================================================
   KONAMI CODE EASTER EGG
================================================================ */
const KONAMI = [38,38,40,40,37,39,37,39,66,65];
let konamiIdx = 0;
document.addEventListener('keydown', e => {
    if (e.keyCode === KONAMI[konamiIdx]) konamiIdx++;
    else konamiIdx = 0;
    if (konamiIdx === KONAMI.length) {
        konamiIdx = 0;
        play1Up();
        if (!isHacker) {
            const t = document.getElementById('mode-toggle');
            if (t) { t.checked = true; applyMode(); }
        }
        // Show easter egg popup
        const div = document.createElement('div');
        div.style.cssText = [
            'position:fixed','top:50%','left:50%',
            'transform:translate(-50%,-50%)',
            'font-family:"Press Start 2P",monospace',
            'font-size:1rem','color:#ffd60a',
            'text-shadow:4px 4px 0 #000',
            'z-index:99999','text-align:center',
            'pointer-events:none',
            'animation:scoreUp 3.5s ease forwards',
            'line-height:2'
        ].join(';');
        div.innerHTML = '★ 1 UP ★<br><small style="font-size:.5rem;color:#fff">KONAMI CODE UNLOCKED</small>';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3500);
        showAchievement('🕹️','ACHIEVEMENT','KONAMI MASTER');
        addScore(9999);
    }
});

/* ================================================================
   NAVIGATION — with retro screen wipe (gaming) or hack overlay
================================================================ */
function navigate(role) {
    localStorage.setItem('userRole', role);
    const dest = role === 'admin' ? 'admin.html' : 'estudiante.html';

    addScore(100);

    if (isHacker) {
        const ho = document.getElementById('ho-title');
        if (ho) ho.textContent = role === 'admin' ? 'AUTENTICANDO_DOCENTE' : 'AUTENTICANDO_ESTUDIANTE';
        runHackOverlay(() => { window.location.href = dest; });
    } else {
        // Retro screen wipe + warp sound
        playWarp();
        const wipe = document.getElementById('screen-wipe');
        if (wipe) {
            wipe.classList.add('active');
            setTimeout(() => { window.location.href = dest; }, 480);
        } else {
            const pw = document.getElementById('page-wrap') || document.querySelector('.page-wrap');
            if (pw) { pw.style.opacity='0'; pw.style.transform='scale(0.95)'; }
            setTimeout(() => { window.location.href = dest; }, 450);
        }
    }
}

/* ================================================================
   HOVER SOUNDS — attach to cards/buttons for gaming mode
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.role-card, .pixel-btn').forEach(el => {
        el.addEventListener('mouseenter', () => { if (!isHacker) playJump(); });
        el.addEventListener('click',      () => { if (!isHacker) playCoin(); });
    });
    // Show welcome achievement after load
    setTimeout(() => {
        if (!isHacker) showAchievement('🎮','BIENVENIDO','Portafolio cargado');
    }, 1500);
});
/* ================================================================
   RETRO CHATBOT — BIT-BOT 8px  (shared across all pages)
================================================================ */
(function() {

/* ── ÁRBOL DE CONVERSACIÓN ──────────────────────────────────────
   Cada nodo tiene: id, msg (texto del bot), opts (array de opciones)
   Cada opción: { label, next } donde next es id del siguiente nodo
   Si next === '__back__' vuelve al menú anterior
   Si next === '__root__' vuelve al inicio
   Si next === '__end__'  solo muestra el mensaje, sin opciones
─────────────────────────────────────────────────────────────── */
const TREE = {

  root: {
    msg: '¡Hola! Soy BIT-BOT 8px, tu asistente retro 🎮 ¿En qué te ayudo?',
    opts: [
      { label: '🗺️ ¿Cómo usar esta página?', next: 'nav' },
      { label: '📚 Dudas del curso BD II',    next: 'bd' },
      { label: '👤 ¿Quién es el estudiante?', next: 'about' },
      { label: '⭐ ¿Qué son los mundos?',     next: 'worlds' },
    ]
  },

  /* ── NAVEGACIÓN ── */
  nav: {
    msg: '¿Sobre qué parte de la página quieres saber?',
    opts: [
      { label: '🏠 La página principal',        next: 'nav_index' },
      { label: '🎓 Vista del estudiante',        next: 'nav_student' },
      { label: '🔐 Vista del administrador',     next: 'nav_admin' },
      { label: '💀 ¿Qué es el Modo Hacker?',    next: 'nav_hacker' },
      { label: '◀ Volver',                       next: '__root__' },
    ]
  },
  nav_index: {
    msg: 'La página principal (index) es la pantalla de bienvenida del portafolio. Muestra el perfil del estudiante, las estadísticas del curso y las misiones académicas. Desde ahí puedes entrar como Estudiante o Admin. ¡Es como la pantalla START de un videojuego! 🕹️',
    opts: [
      { label: '¿Cómo entrar como Estudiante?', next: 'nav_student' },
      { label: '¿Cómo entrar como Admin?',      next: 'nav_admin' },
      { label: '◀ Volver al menú',              next: '__root__' },
    ]
  },
  nav_student: {
    msg: '¿Qué parte de la vista del Estudiante te interesa?',
    opts: [
      { label: '🗺️ El mapa de niveles',   next: 'nav_map' },
      { label: '📂 Abrir semanas/archivos', next: 'nav_weeks' },
      { label: '🖼️ El visor de imágenes', next: 'nav_imgs' },
      { label: '👤 Mi perfil',             next: 'nav_profile' },
      { label: '◀ Volver',                 next: 'nav' },
    ]
  },
  nav_map: {
    msg: 'Al entrar a la pestaña CONTENIDO verás el mapa de mundos estilo videojuego retro. Hay 4 unidades (mundos). Usa ◀▶ del teclado para moverte por el camino, y ENTER o clic para entrar al mundo seleccionado. El último mundo tiene una corona 👑 especial. 🗺️',
    opts: [
      { label: '¿Cómo vuelvo al mapa?',  next: 'nav_map_back' },
      { label: '◀ Volver',               next: 'nav_student' },
    ]
  },
  nav_map_back: {
    msg: 'Una vez dentro de un mundo (unidad), verás el botón "🗺️ VOLVER AL MAPA" en la parte superior izquierda. ¡Haz clic ahí para regresar al mapa y elegir otro mundo! 👾',
    opts: [
      { label: '◀ Volver',  next: 'nav_student' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  nav_weeks: {
    msg: 'Dentro de cada mundo verás las semanas del curso. Haz clic en una semana para expandirla y ver los archivos subidos. Si la semana tiene archivos, aparecerán como tarjetas con ícono según el tipo (PDF 📄, imagen 🖼️, otro 📦). ¡También puedes usar la barra de búsqueda para filtrar! 🔍',
    opts: [
      { label: '🖼️ ¿Cómo ver imágenes?', next: 'nav_imgs' },
      { label: '◀ Volver',               next: 'nav_student' },
    ]
  },
  nav_imgs: {
    msg: 'Haz clic en cualquier imagen para abrirla en el visor. Dentro puedes: usar los botones + / - para zoom, arrastrar la imagen con el mouse cuando está con zoom, navegar entre imágenes de la misma semana con ◀▶, y cerrar con la X o la tecla Escape. 🖼️',
    opts: [
      { label: '◀ Volver',  next: 'nav_student' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  nav_profile: {
    msg: 'La pestaña PERFIL muestra la información del estudiante: foto, carrera, barras de habilidades, misión académica y datos del curso. ¡Es como la pantalla de personaje en un RPG! ⚔️',
    opts: [
      { label: '◀ Volver',  next: 'nav_student' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  nav_admin: {
    msg: 'El panel de administrador (admin.html) requiere un token de GitHub. Con ese token puedes subir archivos a las semanas, editarlos o eliminarlos. Solo el docente tiene acceso. 🔐',
    opts: [
      { label: '¿Qué es un token de GitHub?', next: 'nav_token' },
      { label: '◀ Volver',                    next: 'nav' },
    ]
  },
  nav_token: {
    msg: 'Un Personal Access Token (PAT) de GitHub es una clave que genera el docente en su cuenta de GitHub (Settings → Developer settings → Tokens). Con permisos de "repo" permite subir archivos al repositorio que alimenta este portafolio. 🔑',
    opts: [
      { label: '◀ Volver',  next: 'nav_admin' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  nav_hacker: {
    msg: 'El Modo Hacker 💀 es un modo visual alternativo que transforma la página a una estética Matrix/terminal verde. ¡Actívalo con el botón verde brillante en la esquina superior derecha! Todo cambia: colores, textos en glitch, lluvia de código... 🟢',
    opts: [
      { label: '¿Cómo lo desactivo?', next: 'nav_hacker_off' },
      { label: '◀ Volver',           next: 'nav' },
    ]
  },
  nav_hacker_off: {
    msg: 'Haz clic de nuevo en el mismo botón (que ahora dirá "DEEP_WEB: ON") para volver al modo retro normal. El estado se guarda automáticamente, así que si recargas la página, recuerda el modo que elegiste. 🔄',
    opts: [
      { label: '◀ Volver',  next: 'nav_hacker' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },

  /* ── BASE DE DATOS II ── */
  bd: {
    msg: '¿Sobre qué tema de Base de Datos II tienes dudas?',
    opts: [
      { label: '🗄️ Unidad 1 — Fundamentos y Arquitectura', next: 'bd_u1' },
      { label: '⚡ Unidad 2 — Indexación y Performance',   next: 'bd_u2' },
      { label: '🔒 Unidad 3 — Concurrencia y Transacciones', next: 'bd_u3' },
      { label: '🛡️ Unidad 4 — Seguridad y Arquitecturas', next: 'bd_u4' },
      { label: '◀ Volver al inicio',                       next: '__root__' },
    ]
  },
  bd_u1: {
    msg: '¿Qué te genera dudas en Fundamentos y Arquitectura?',
    opts: [
      { label: '¿Qué es el Modelado Relacional?', next: 'bd_relacional' },
      { label: '¿Qué es la Normalización?',        next: 'bd_normal' },
      { label: '¿Qué es el Álgebra Relacional?',  next: 'bd_algebra' },
      { label: '◀ Volver',                         next: 'bd' },
    ]
  },
  bd_relacional: {
    msg: 'El Modelo Relacional organiza los datos en tablas (relaciones) con filas (tuplas) y columnas (atributos). Cada tabla tiene una clave primaria (PK) que identifica de forma única cada fila. Las tablas se relacionan entre sí usando claves foráneas (FK). 🗄️',
    opts: [
      { label: '¿Y la normalización?', next: 'bd_normal' },
      { label: '◀ Volver',            next: 'bd_u1' },
    ]
  },
  bd_normal: {
    msg: 'Normalizar es organizar una BD para eliminar redundancias. Las formas normales más importantes son: 1FN (sin grupos repetidos), 2FN (sin dependencias parciales de la PK), 3FN (sin dependencias transitivas). En SQL Server trabajamos hasta 3FN o FNBC. 📐',
    opts: [
      { label: '¿Qué es FNBC?',   next: 'bd_fnbc' },
      { label: '◀ Volver',        next: 'bd_u1' },
    ]
  },
  bd_fnbc: {
    msg: 'La Forma Normal de Boyce-Codd (FNBC) es más estricta que 3FN. Una tabla está en FNBC si para toda dependencia funcional X→Y, X es una superclave. Resuelve anomalías que 3FN no cubre. 🔍',
    opts: [
      { label: '◀ Volver',  next: 'bd_normal' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  bd_algebra: {
    msg: 'El Álgebra Relacional es la base teórica del SQL. Sus operaciones principales son: σ (selección de filas), π (proyección de columnas), ⋈ (join), ∪ (unión), − (diferencia), × (producto cartesiano). En SQL Server estas operaciones se expresan con SELECT, WHERE, JOIN, etc. ➗',
    opts: [
      { label: '◀ Volver',  next: 'bd_u1' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  bd_u2: {
    msg: '¿Qué te genera dudas en Indexación y Performance?',
    opts: [
      { label: '¿Qué es un índice B-Tree?',       next: 'bd_btree' },
      { label: '¿Índice Clustered vs Non-Clustered?', next: 'bd_clustered' },
      { label: '¿Cómo analizo el Query Plan?',    next: 'bd_qplan' },
      { label: '◀ Volver',                         next: 'bd' },
    ]
  },
  bd_btree: {
    msg: 'SQL Server usa índices B-Tree (Balanced Tree). Son estructuras en árbol donde los datos se ordenan jerárquicamente para búsquedas en O(log n). La raíz apunta a nodos internos que apuntan a las páginas de datos (hojas). Permiten búsquedas, rangos y ordenamientos rápidos. 🌳',
    opts: [
      { label: '¿Clustered vs Non-Clustered?', next: 'bd_clustered' },
      { label: '◀ Volver',                     next: 'bd_u2' },
    ]
  },
  bd_clustered: {
    msg: 'Clustered Index: ordena físicamente los datos en disco según la clave. Solo puede haber UNO por tabla (normalmente la PK). Non-Clustered Index: estructura separada con punteros a los datos. Puede haber varios. Si buscas por columnas que no son PK, un Non-Clustered mejora mucho el rendimiento. ⚡',
    opts: [
      { label: '◀ Volver',  next: 'bd_u2' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  bd_qplan: {
    msg: 'El Query Execution Plan (Plan de ejecución) en SQL Server muestra cómo el motor ejecutará tu consulta. Actívalo con Ctrl+M o con el botón "Include Actual Execution Plan". Los operadores costosos (Table Scan, Hash Join) y el % de costo indican dónde optimizar. 📊',
    opts: [
      { label: '◀ Volver',  next: 'bd_u2' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  bd_u3: {
    msg: '¿Qué te genera dudas en Concurrencia y Transacciones?',
    opts: [
      { label: '¿Qué son las propiedades ACID?', next: 'bd_acid' },
      { label: '¿Qué es un Deadlock?',           next: 'bd_deadlock' },
      { label: '¿Qué es MVCC?',                  next: 'bd_mvcc' },
      { label: '◀ Volver',                        next: 'bd' },
    ]
  },
  bd_acid: {
    msg: 'ACID son las 4 propiedades de las transacciones: ✅ Atomicidad (todo o nada), ✅ Consistencia (la BD pasa de un estado válido a otro), ✅ Aislamiento (las transacciones no se interfieren entre sí), ✅ Durabilidad (los cambios confirmados persisten aunque haya un fallo). BEGIN TRAN + COMMIT/ROLLBACK las garantizan. 🔒',
    opts: [
      { label: '¿Y los Deadlocks?', next: 'bd_deadlock' },
      { label: '◀ Volver',         next: 'bd_u3' },
    ]
  },
  bd_deadlock: {
    msg: 'Un Deadlock ocurre cuando dos transacciones se bloquean mutuamente: A espera a B y B espera a A. SQL Server detecta esto automáticamente y mata a la víctima (la de menor costo de rollback). Para prevenirlos: accede a los recursos siempre en el mismo orden, y mantén transacciones cortas. ⚠️',
    opts: [
      { label: '◀ Volver',  next: 'bd_u3' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  bd_mvcc: {
    msg: 'MVCC (Multi-Version Concurrency Control) permite que lecturas no bloqueen escrituras. SQL Server lo implementa con el nivel de aislamiento SNAPSHOT. Cada transacción ve una versión consistente de los datos al momento en que inició, guardada en tempdb. Mejora el rendimiento en cargas concurrentes. 📸',
    opts: [
      { label: '◀ Volver',  next: 'bd_u3' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  bd_u4: {
    msg: '¿Qué te genera dudas en Seguridad y Arquitecturas?',
    opts: [
      { label: '¿Cómo funciona la seguridad en SQL Server?', next: 'bd_security' },
      { label: '¿Qué es replicación/alta disponibilidad?',   next: 'bd_ha' },
      { label: '¿Qué es un procedimiento almacenado?',       next: 'bd_sp' },
      { label: '◀ Volver',                                    next: 'bd' },
    ]
  },
  bd_security: {
    msg: 'SQL Server maneja seguridad en capas: 🔐 Autenticación (Windows o SQL login), 🔐 Autorización (roles de servidor y BD, permisos GRANT/DENY/REVOKE), 🔐 Cifrado (TDE para datos en reposo, SSL para datos en tránsito), 🔐 Row-Level Security (filtrar filas por usuario). 🛡️',
    opts: [
      { label: '◀ Volver',  next: 'bd_u4' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  bd_ha: {
    msg: 'Alta Disponibilidad en SQL Server incluye: Always On Availability Groups (réplicas sincrónicas), Log Shipping (envío de logs a un servidor secundario), Database Mirroring (espejo en tiempo real, deprecado en versiones recientes) y Failover Cluster Instance (FCI). El objetivo: minimizar el tiempo de inactividad (RTO) y la pérdida de datos (RPO). 🏗️',
    opts: [
      { label: '◀ Volver',  next: 'bd_u4' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  bd_sp: {
    msg: 'Un Stored Procedure (SP) es un bloque T-SQL precompilado guardado en la BD. Ventajas: reutilizable, más seguro (evita SQL injection), mejor rendimiento (plan de ejecución cacheado), permite lógica compleja con variables, condicionales y loops. Se crea con CREATE PROCEDURE y se ejecuta con EXEC. 📋',
    opts: [
      { label: '◀ Volver',  next: 'bd_u4' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },

  /* ── SOBRE EL ESTUDIANTE ── */
  about: {
    msg: 'Este portafolio pertenece a Jared Josue Meza Medina, estudiante de Ingeniería de Sistemas y Computación en la UPLA, Ciclo V, semestre 2026-I. Especializado en gestión de datos y seguridad informática con SQL Server y PostgreSQL. 🎓',
    opts: [
      { label: '¿Qué tecnologías usa?',        next: 'about_tech' },
      { label: '¿Dónde ver su repositorio?',   next: 'about_repo' },
      { label: '◀ Volver al inicio',           next: '__root__' },
    ]
  },
  about_tech: {
    msg: 'Tecnologías del curso: SQL Server 2022 🗄️, PostgreSQL 16 🐘, T-SQL, PL/pgSQL, Triggers, Stored Procedures, Índices B-Tree, Replicación y Seguridad de BD. En el portafolio: HTML, CSS y JavaScript vanilla. ⚡',
    opts: [
      { label: '◀ Volver',  next: 'about' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },
  about_repo: {
    msg: 'El repositorio del curso está en GitHub: github.com/JaredASD/Base_de_datos_2. Ahí están todos los scripts T-SQL, evidencias y archivos de cada semana del semestre 2026-I. 🐙',
    opts: [
      { label: '◀ Volver',  next: 'about' },
      { label: '🏠 Inicio', next: '__root__' },
    ]
  },

  /* ── MUNDOS ── */
  worlds: {
    msg: 'El portafolio se organiza en 4 mundos (unidades), cada uno con 4 semanas de evidencias académicas. Aquí el resumen: 🗺️',
    opts: [
      { label: '🌱 World 1 — Fundamentos',     next: 'w1' },
      { label: '⚡ World 2 — Indexación',      next: 'w2' },
      { label: '🔒 World 3 — Concurrencia',    next: 'w3' },
      { label: '👑 World 4 — Seguridad (BOSS)',next: 'w4' },
      { label: '◀ Volver al inicio',           next: '__root__' },
    ]
  },
  w1: {
    msg: 'World 1 — FUNDAMENTOS Y ARQUITECTURA (Semanas 1-4): Modelado relacional, Álgebra relacional, Normalización (1FN, 2FN, 3FN, FNBC) y arquitectura interna de los SGBD. 🌱',
    opts: [{ label: '◀ Volver', next: 'worlds' }, { label: '🏠 Inicio', next: '__root__' }]
  },
  w2: {
    msg: 'World 2 — INDEXACIÓN Y PERFORMANCE (Semanas 5-8): Índices B-Tree, Clustered vs Non-Clustered, Query Execution Plans, optimización de consultas y estadísticas del motor. ⚡',
    opts: [{ label: '◀ Volver', next: 'worlds' }, { label: '🏠 Inicio', next: '__root__' }]
  },
  w3: {
    msg: 'World 3 — CONCURRENCIA Y TRANSACCIONES (Semanas 9-12): Propiedades ACID, niveles de aislamiento, Deadlocks, Locks, MVCC y manejo de transacciones distribuidas. 🔒',
    opts: [{ label: '◀ Volver', next: 'worlds' }, { label: '🏠 Inicio', next: '__root__' }]
  },
  w4: {
    msg: 'World 4 — SEGURIDAD Y ARQUITECTURAS (Semanas 13-16): Seguridad en SQL Server (autenticación, autorización, cifrado), Alta Disponibilidad, Always On, replicación y arquitecturas de BD distribuidas. 👑 ¡El nivel final!',
    opts: [{ label: '◀ Volver', next: 'worlds' }, { label: '🏠 Inicio', next: '__root__' }]
  },
};

/* ── ESTADO ── */
let rbotOpen    = false;
let rbotHistory = [];   // pila de nodos visitados
let rbotCurrent = 'root';
let rbotBadge   = 0;

/* ── SPRITE SVG 8-bit (character pixel-art, pure SVG) ── */
const SPRITE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 17" width="52" height="68">
  <!-- head -->
  <rect x="3" y="0" width="7" height="1" fill="#f5c842"/>
  <rect x="2" y="1" width="9" height="1" fill="#f5c842"/>
  <rect x="1" y="2" width="11" height="5" fill="#f5c842"/>
  <!-- eyes -->
  <rect x="3" y="3" width="2" height="2" fill="#1a1a2e"/>
  <rect x="8" y="3" width="2" height="2" fill="#1a1a2e"/>
  <!-- eye shine -->
  <rect x="3" y="3" width="1" height="1" fill="#fff"/>
  <rect x="8" y="3" width="1" height="1" fill="#fff"/>
  <!-- mouth -->
  <rect x="4" y="6" width="1" height="1" fill="#c0392b"/>
  <rect x="5" y="7" width="3" height="1" fill="#c0392b"/>
  <rect x="8" y="6" width="1" height="1" fill="#c0392b"/>
  <!-- neck -->
  <rect x="5" y="8" width="3" height="1" fill="#f5c842"/>
  <!-- body -->
  <rect x="2" y="9" width="9" height="4" fill="#2471a3"/>
  <!-- logo on shirt -->
  <rect x="5" y="10" width="3" height="2" fill="#1a5276"/>
  <rect x="6" y="10" width="1" height="2" fill="#f5c842"/>
  <!-- arms -->
  <rect x="0" y="9"  width="2" height="3" fill="#2471a3"/>
  <rect x="11" y="9" width="2" height="3" fill="#2471a3"/>
  <!-- hands -->
  <rect x="0" y="12"  width="2" height="2" fill="#f5c842"/>
  <rect x="11" y="12" width="2" height="2" fill="#f5c842"/>
  <!-- legs -->
  <rect x="2" y="13" width="4" height="3" fill="#1a252f"/>
  <rect x="7" y="13" width="4" height="3" fill="#1a252f"/>
  <!-- shoes -->
  <rect x="1"  y="15" width="4" height="2" fill="#1a1a2e"/>
  <rect x="8"  y="15" width="4" height="2" fill="#1a1a2e"/>
</svg>`;

/* ── INJECT HTML ── */
function rbotInject() {
    const wrap = document.createElement('div');
    wrap.className = 'rbot-wrap';
    wrap.id = 'rbot-wrap';
    wrap.innerHTML = `
      <!-- Chat window -->
      <div class="rbot-window" id="rbot-window">
        <div class="rbot-titlebar">
          <div class="rbot-titlebar-left">
            <div class="rbot-dot"></div>
            <div class="rbot-dot"></div>
            <span>BIT-BOT 8px — ASISTENTE</span>
          </div>
          <button class="rbot-close-btn" onclick="rbotToggle()" title="Cerrar">✕</button>
        </div>
        <div class="rbot-messages" id="rbot-messages"></div>
        <div class="rbot-options" id="rbot-options"></div>
      </div>

      <!-- 8-bit character -->
      <div class="rbot-char-wrap" id="rbot-char" onclick="rbotToggle()" title="Abrir asistente">
        <div class="rbot-hint-bubble" id="rbot-hint">¡Hola! ¿Necesitas ayuda? 👾</div>
        <div class="rbot-sprite" id="rbot-sprite">${SPRITE_SVG}</div>
        <div class="rbot-nametag">BIT-BOT 8px</div>
      </div>`;
    document.body.appendChild(wrap);
    rbotGoTo('root', false);
}

/* ── TOGGLE ── */
function rbotToggle() {
    rbotOpen = !rbotOpen;
    document.getElementById('rbot-window').classList.toggle('open', rbotOpen);
    if (rbotOpen) {
        rbotClearBadge();
        setTimeout(() => {
            const msgs = document.getElementById('rbot-messages');
            if (msgs) msgs.scrollTop = msgs.scrollHeight;
        }, 250);
    }
    if (typeof playJump === 'function') playJump();
}

/* ── NAVIGATE TO A NODE ── */
function rbotGoTo(nodeId, pushHistory = true) {
    if (nodeId === '__root__')  { rbotHistory = []; nodeId = 'root'; }
    if (nodeId === '__back__')  { nodeId = rbotHistory.pop() || 'root'; pushHistory = false; }
    if (nodeId === '__end__')   { return; }

    const node = TREE[nodeId];
    if (!node) return;

    if (pushHistory && rbotCurrent !== nodeId) rbotHistory.push(rbotCurrent);
    rbotCurrent = nodeId;

    // Add bot message with typing delay
    rbotAddMsg('bot', '...typing', true);
    setTimeout(() => {
        rbotRemoveTyping();
        rbotAddMsg('bot', node.msg, false);
        rbotRenderOptions(node.opts || []);
        const msgs = document.getElementById('rbot-messages');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;

        // Badge if closed
        if (!rbotOpen) { rbotBadge++; rbotShowBadge(); }
    }, 380);
}

/* ── USER PICKS AN OPTION ── */
function rbotPick(label, next) {
    rbotAddMsg('user', label, false);
    setTimeout(() => rbotGoTo(next), 200);
}

/* ── ADD MESSAGE ── */
function rbotAddMsg(who, text, isTyping) {
    const msgs = document.getElementById('rbot-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'rbot-msg ' + who + (isTyping ? ' rbot-typing-wrap' : '');
    if (isTyping) {
        div.innerHTML = `<div class="rbot-msg-avatar">🤖</div>
          <div class="rbot-msg-bubble"><div class="rbot-typing"><span></span><span></span><span></span></div></div>`;
    } else {
        const avatar = who === 'bot' ? '🤖' : '🧑‍💻';
        div.innerHTML = `<div class="rbot-msg-avatar">${avatar}</div>
          <div class="rbot-msg-bubble">${text}</div>`;
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}
function rbotRemoveTyping() {
    const t = document.querySelector('.rbot-typing-wrap');
    if (t) t.remove();
}

/* ── RENDER OPTIONS ── */
function rbotRenderOptions(opts) {
    const container = document.getElementById('rbot-options');
    if (!container) return;
    container.innerHTML = '';
    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'rbot-opt-btn';
        btn.textContent = opt.label;
        btn.onclick = () => rbotPick(opt.label, opt.next);
        container.appendChild(btn);
    });
}

/* ── BADGE ── */
function rbotShowBadge() {
    let badge = document.getElementById('rbot-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'rbot-badge';
        badge.id = 'rbot-badge';
        document.getElementById('rbot-char').appendChild(badge);
    }
    badge.textContent = rbotBadge > 9 ? '9+' : rbotBadge;
}
function rbotClearBadge() {
    rbotBadge = 0;
    const b = document.getElementById('rbot-badge');
    if (b) b.remove();
}

/* ── HACKER MODE HINT UPDATE ── */
function rbotSyncHackerHint() {
    const hint = document.getElementById('rbot-hint');
    if (!hint) return;
    hint.textContent = document.body.classList.contains('hacker-mode')
        ? '> ASISTENCIA_LISTA 🟢'
        : '¡Hola! ¿Necesitas ayuda? 👾';
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
    rbotInject();
    // Expose to global scope for inline onclick handlers
    window.rbotToggle = rbotToggle;
    window.rbotPick   = rbotPick;
    // Sync hacker hint when mode changes
    const obs = new MutationObserver(rbotSyncHackerHint);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // Show badge after 3s to invite first interaction
    setTimeout(() => { if (!rbotOpen) { rbotBadge = 1; rbotShowBadge(); } }, 3000);
});

})(); // end IIFE
