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
   PERSIST MODE ON LOAD
================================================================ */
function checkSavedMode() {
    if (localStorage.getItem('visualMode') === 'hacker') {
        const toggle = document.getElementById('mode-toggle');
        if (toggle) { toggle.checked = true; applyMode(); }
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