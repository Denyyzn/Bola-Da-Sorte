import { clubs } from "./clubs.js";
import { shirts } from "./shirts.js";

const introScreen = document.getElementById("intro-screen");
const gameScreen = document.getElementById("game-screen");
const nameInput = document.getElementById("player-name");
const seedInput = document.getElementById("seed-input");
const introStartBtn = document.getElementById("intro-start-btn");
const hudEyebrow = document.getElementById("hud-eyebrow");

const roadEl = document.getElementById("road");
const ageValueEl = document.getElementById("age-value");
const packCard = document.getElementById("pack-card");
const packIcon = document.getElementById("pack-icon");
const packCaption = document.getElementById("pack-caption");
const packRevealed = document.getElementById("pack-revealed");
const finalCard = document.getElementById("final-card");
const finalVerdict = document.getElementById("final-verdict");
const finalSub = document.getElementById("final-sub");
const finalStats = document.getElementById("final-stats");
const finalTrophies = document.getElementById("final-trophies");
const startBtn = document.getElementById("start-btn");
const saveImageBtn = document.getElementById("save-image-btn");
const confettiCanvas = document.getElementById("confetti-canvas");

const sleep = (seconds) => new Promise((r) => setTimeout(r, seconds * 1000));

/* ---------------- Seeded RNG ---------------- */
/* xmur3 hashes any seed string into a 32-bit int; mulberry32 turns that
   into a fast, deterministic 0..1 generator. Same seed -> same career. */

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSeedString() {
  return Math.random().toString(36).slice(2, 10);
}

let rng = Math.random;
let currentSeed = "";
let currentPlayerName = "";

function seedRng(seedStr) {
  currentSeed = seedStr;
  rng = mulberry32(xmur3(seedStr)());
}

function random(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(rng() * (max - min + 1)) + min;
}

const times = [
  1, 1, 1, 1, 1, 1,
  2, 2, 2, 2, 2, 2, 2, 2,
  3, 3, 3, 3, 3, 3, 3,
  4, 4, 4, 4, 4, 4,
  5, 5, 5, 5, 5,
  6, 6, 6, 6,
  7, 7, 7,
  8, 8,
  9,
  10,
];

function drawClub() {
  const c = clubs[Math.floor(rng() * clubs.length)];
  const time = times[Math.floor(rng() * times.length)];
  return { time, name: c.name, flag: c.flag, tier: c.tier ?? 3 };
}

function tierClassFor(tier) {
  if (tier <= 1) return "tier-1";
  if (tier === 2) return "tier-2";
  if (tier === 3) return "tier-3";
  return "tier-4";
}

function starsFor(tier) {
  const filled = Math.max(1, Math.min(5, tier));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

/* ---------------- Pack card control ---------------- */

function sealPack(caption, icon = "⚽") {
  packCard.classList.remove("is-revealed");
  packCard.classList.add("shuffling");
  packCaption.textContent = caption;
  packIcon.textContent = icon;
}

function unsealPack(html, tierClass) {
  packCard.classList.remove("shuffling");
  packRevealed.className = "pack-face pack-revealed" + (tierClass ? " " + tierClass : "");
  packRevealed.innerHTML = html;
  packCard.classList.add("is-revealed");
}

function animateCount(el, target, duration = 700) {
  return new Promise((resolve) => {
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(eased * target);
      if (t < 1) requestAnimationFrame(step);
      else {
        el.textContent = target;
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

/* ---------------- Road ---------------- */

function addRoadStop(startAge, endAge, name, flag, tierClass) {
  const li = document.createElement("li");
  li.className = "road-stop " + tierClass;
  const range = endAge > startAge ? `${startAge}–${endAge}` : `${startAge}`;
  li.innerHTML = `<span class="road-flag">${flag}</span><span class="road-name">${name}</span><span class="road-age">${range}</span>`;
  roadEl.appendChild(li);
  requestAnimationFrame(() => {
    roadEl.parentElement.scrollLeft = roadEl.parentElement.scrollWidth;
  });
}

function setAge(age) {
  ageValueEl.textContent = age;
}

/* ---------------- Confetti ---------------- */

function confettiBurst() {
  const ctx = confettiCanvas.getContext("2d");
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  const colors = ["#f2c94c", "#f2a93b", "#4fd1c5", "#f3f0e6", "#b98aff"];
  const particles = Array.from({ length: 70 }, () => ({
    x: confettiCanvas.width / 2,
    y: confettiCanvas.height / 3,
    vx: (Math.random() - 0.5) * 10,
    vy: Math.random() * -10 - 4,
    size: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
  }));
  let frame = 0;
  function tick() {
    frame++;
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    particles.forEach((p) => {
      p.vy += 0.28;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (frame < 130) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
  requestAnimationFrame(tick);
}

/* ---------------- Career step generator ---------------- */

const results = {};

async function* runCareer() {
  let age = 17;
  ageValueEl.classList.add("is-live");
  roadEl.innerHTML = "";
  packCard.style.display = "";
  setAge(age);
  results.stops = [];

  while (age <= 35) {
    const draw = drawClub();
    const startAge = age;
    sealPack("Sorteando clube…");
    await sleep(0.65);
    const html = `
      <span class="pack-flag">${draw.flag}</span>
      <span class="pack-title">${draw.name}</span>
      <span class="pack-stars">${starsFor(draw.tier)}</span>
      <span class="pack-badge">Contrato · ${draw.time} ano(s)</span>
    `;
    unsealPack(html, tierClassFor(draw.tier));
    age += draw.time;
    addRoadStop(startAge, age - 1, draw.name, draw.flag, tierClassFor(draw.tier));
    results.stops.push({ startAge, endAge: age - 1, name: draw.name, flag: draw.flag });
    setAge(age - 1);
    yield { label: "PRÓXIMO CLUBE" };
  }

  ageValueEl.classList.remove("is-live");

  sealPack("Sorteando N°/posição…", "🎽");
  await sleep(0.6);
  const shirt = shirts[Math.floor(rng() * shirts.length)];
  results.shirtNum = shirt.num;
  results.shirtPos = shirt.pos;
  unsealPack(
    `<span class="pack-icon-lg">🎽</span><span class="pack-title">${shirt.num} · ${shirt.pos}</span><span class="pack-label">Número e posição</span>`,
    "tier-stat"
  );
  yield { label: "CONTINUAR" };

  sealPack("Sorteando partidas…", "🏟️");
  await sleep(0.55);
  const matches = random(50, 980);
  const idM = "n-matches";
  unsealPack(
    `<span class="pack-icon-lg">🏟️</span><span class="pack-number" id="${idM}">0</span><span class="pack-label">Partidas jogadas</span>`,
    "tier-stat"
  );
  await animateCount(document.getElementById(idM), matches, 700);
  results.matches = matches;
  yield { label: "CONTINUAR" };

  sealPack("Sorteando gols…", "⚽");
  await sleep(0.55);
  const gols = random(0, Math.floor(matches * 1.3));
  const idG = "n-gols";
  unsealPack(
    `<span class="pack-icon-lg">⚽</span><span class="pack-number" id="${idG}">0</span><span class="pack-label">Gols marcados</span>`,
    "tier-stat"
  );
  await animateCount(document.getElementById(idG), gols, 700);
  results.gols = gols;
  yield { label: "CONTINUAR" };

  sealPack("Sorteando assistências…", "🅰️");
  await sleep(0.55);
  const assis = random(0, matches);
  const idA = "n-assis";
  unsealPack(
    `<span class="pack-icon-lg">🅰️</span><span class="pack-number" id="${idA}">0</span><span class="pack-label">Assistências</span>`,
    "tier-stat"
  );
  await animateCount(document.getElementById(idA), assis, 700);
  results.assis = assis;
  yield { label: "CONTINUAR" };

  const titNacionais = random(1, 100) < 80;
  results.nNacionais = titNacionais ? random(1, 30) : 0;
  sealPack("Títulos nacionais…", "🏆");
  await sleep(0.55);
  unsealPack(
    titNacionais
      ? `<span class="pack-icon-lg">🏆</span><span class="pack-title">Títulos Nacionais?</span><span class="pack-answer good">SIM ✅</span><span class="pack-badge">${results.nNacionais}× conquistado</span>`
      : `<span class="pack-icon-lg dim">🏆</span><span class="pack-title">Títulos Nacionais?</span><span class="pack-answer bad">NÃO ❌</span>`,
    titNacionais ? "tier-good" : "tier-none"
  );
  yield { label: "CONTINUAR" };

  const titInternacionais = random(1, 100) < 60;
  results.nInternacionais = titInternacionais ? random(1, 15) : 0;
  sealPack("Títulos internacionais…", "🏆");
  await sleep(0.55);
  unsealPack(
    titInternacionais
      ? `<span class="pack-icon-lg">🏆</span><span class="pack-title">Títulos Internacionais?</span><span class="pack-answer good">SIM ✅</span><span class="pack-badge">${results.nInternacionais}× conquistado</span>`
      : `<span class="pack-icon-lg dim">🏆</span><span class="pack-title">Títulos Internacionais?</span><span class="pack-answer bad">NÃO ❌</span>`,
    titInternacionais ? "tier-good" : "tier-none"
  );
  yield { label: "CONTINUAR" };

  const championsLeague = random(1, 100) < 50;
  results.nChampions = championsLeague ? random(1, 6) : 0;
  results.championsLeague = championsLeague;
  sealPack("Champions League…", "🏆");
  await sleep(0.55);
  unsealPack(
    championsLeague
      ? `<span class="pack-icon-lg">🏆</span><span class="pack-title">Champions League?</span><span class="pack-answer good">SIM ✅</span><span class="pack-badge">${results.nChampions}× conquistado</span>`
      : `<span class="pack-icon-lg dim">🏆</span><span class="pack-title">Champions League?</span><span class="pack-answer bad">NÃO ❌</span>`,
    championsLeague ? "tier-legend" : "tier-none"
  );
  if (championsLeague) confettiBurst();
  yield { label: "CONTINUAR" };

  const worldCup = random(1, 100) < 40;
  results.nWorldCup = worldCup ? random(1, 4) : 0;
  results.worldCup = worldCup;
  sealPack("Copa do Mundo…", "🌍");
  await sleep(0.55);
  unsealPack(
    worldCup
      ? `<span class="pack-icon-lg">🌍</span><span class="pack-title">Copas do Mundo?</span><span class="pack-answer good">SIM ✅</span><span class="pack-badge">${results.nWorldCup}× conquistado</span>`
      : `<span class="pack-icon-lg dim">🌍</span><span class="pack-title">Copas do Mundo?</span><span class="pack-answer bad">NÃO ❌</span>`,
    worldCup ? "tier-legend" : "tier-none"
  );
  if (worldCup) confettiBurst();
  yield { label: "CONTINUAR" };

  const ballonDorChance = Math.floor((gols + assis) / 10 + (gols + assis) / (matches / 10));
  const ballonDor = random(1, 100) < ballonDorChance;
  results.nBallonDor = ballonDor ? random(1, 8) : 0;
  results.ballonDor = ballonDor;
  sealPack("Bola de Ouro…", "🏅");
  await sleep(0.55);
  unsealPack(
    ballonDor
      ? `<span class="pack-icon-lg">🏅</span><span class="pack-title">Bolas de Ouro?</span><span class="pack-answer good">SIM ✅</span><span class="pack-badge">${results.nBallonDor}× conquistado</span>`
      : `<span class="pack-icon-lg dim">🏅</span><span class="pack-title">Bolas de Ouro?</span><span class="pack-answer bad">NÃO ❌</span>`,
    ballonDor ? "tier-legend" : "tier-none"
  );
  if (ballonDor) confettiBurst();
  results.titNacionais = titNacionais;
  results.titInternacionais = titInternacionais;
  yield { label: "VER CARTÃO FINAL" };
}

/* ---------------- Driver / state machine ---------------- */

let generator = null;
let uiState = "waiting-intro";

function verdictFor({ ballonDor, championsLeague, worldCup, titInternacionais, titNacionais }) {
  const majors = [championsLeague, worldCup, ballonDor].filter(Boolean).length;
  if (majors === 3) return "A MAIOR LENDA DO FUTEBOL 🐐";
  if (majors >= 2) return "LENDA DO FUTEBOL 👑";
  if (majors === 1 || titInternacionais || titNacionais) return "ÍDOLO DE TORCIDA ⭐";
  return "CARREIRA DISCRETA ⚪";
}

function statBlock(value, label) {
  return `<div class="final-stat"><span class="final-stat-value">${value}</span><span class="final-stat-label">${label}</span></div>`;
}

function trophyChip(label, count) {
  const won = count > 0;
  return `<span class="trophy-chip${won ? " won" : ""}">${label}: ${won ? count : "—"}</span>`;
}

function finalize() {
  finalVerdict.textContent = verdictFor(results);
  const lastAge = results.stops.length ? results.stops[results.stops.length - 1].endAge : 17;
  finalSub.textContent = `17 → ${lastAge} anos · ${results.stops.length} clube(s) · Seed: ${currentSeed}`;
  finalStats.innerHTML =
    statBlock(results.matches, "Partidas") + statBlock(results.gols, "Gols") + statBlock(results.assis, "Assistências");
  finalTrophies.innerHTML =
    trophyChip("Nacionais", results.nNacionais) +
    trophyChip("Internacionais", results.nInternacionais) +
    trophyChip("Champions", results.nChampions) +
    trophyChip("Mundiais", results.nWorldCup) +
    trophyChip("Bolas de Ouro", results.nBallonDor);

  packCard.style.display = "none";
  finalCard.hidden = false;
  uiState = "finished";
  startBtn.disabled = false;
  startBtn.textContent = "JOGAR NOVAMENTE";
}

async function advance() {
  const { value, done } = await generator.next();
  if (done) {
    finalize();
  } else {
    uiState = "waiting";
    startBtn.disabled = false;
    startBtn.textContent = value?.label || "CONTINUAR";
  }
}

async function beginCareer() {
  finalCard.hidden = true;
  uiState = "busy";
  startBtn.disabled = true;
  startBtn.textContent = "EMBARALHANDO…";
  generator = runCareer();
  await advance();
}

async function handleClick() {
  if (uiState === "busy") return;

  if (uiState === "finished") {
    nameInput.value = currentPlayerName;
    seedInput.value = "";
    gameScreen.hidden = true;
    introScreen.style.display = "";
    uiState = "waiting-intro";
    return;
  }

  if (uiState === "waiting") {
    uiState = "busy";
    startBtn.disabled = true;
    startBtn.textContent = "EMBARALHANDO…";
    await advance();
  }
}

function handleIntroStart() {
  currentPlayerName = nameInput.value.trim() || "Jogador";
  const seedValue = seedInput.value.trim() || randomSeedString();
  seedRng(seedValue);

  hudEyebrow.textContent = `CARREIRA DE ${currentPlayerName.toUpperCase()}`;
  introScreen.style.display = "none";
  gameScreen.hidden = false;
  beginCareer();
}

startBtn.addEventListener("click", handleClick);
introStartBtn.addEventListener("click", handleIntroStart);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleIntroStart();
});
seedInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleIntroStart();
});

/* ---------------- Career image export ---------------- */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawJersey(ctx, cx, topY, w, number, name) {
  const h = w * 1.1;
  const x = cx - w / 2;
  ctx.save();
  ctx.translate(x, topY);
  ctx.fillStyle = "#142a21";
  ctx.strokeStyle = "#f2a93b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.28, 0);
  ctx.lineTo(w * 0.72, 0);
  ctx.lineTo(w * 0.98, h * 0.18);
  ctx.lineTo(w * 0.8, h * 0.3);
  ctx.lineTo(w * 0.8, h);
  ctx.lineTo(w * 0.2, h);
  ctx.lineTo(w * 0.2, h * 0.3);
  ctx.lineTo(w * 0.02, h * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w * 0.4, 0);
  ctx.lineTo(w * 0.5, h * 0.14);
  ctx.lineTo(w * 0.6, 0);
  ctx.strokeStyle = "#0e2019";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.textAlign = "center";
  if (name) {
    ctx.fillStyle = "#f3f0e6";
    ctx.font = `700 ${Math.round(w * 0.11)}px "Rajdhani", sans-serif`;
    ctx.fillText(name.toUpperCase(), w / 2, h * 0.26);
  }

  ctx.fillStyle = "#f2a93b";
  ctx.font = `700 ${Math.round(w * 0.4)}px "Teko", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText(String(number), w / 2, h * 0.62);
  ctx.restore();
}

async function generateCareerImage(includeSeed) {
  await document.fonts.ready;

  const W = 720;
  const cols = 2;
  const colW = (W - 64) / cols;
  const rowH = 32;
  const rows = Math.ceil(results.stops.length / cols);

  const headerH = 150;
  const jerseyH = 260;
  const statsH = 110;
  const trophiesH = 70;
  const clubsHeaderH = 44;
  const clubsH = rows * rowH + 16;
  const footerH = 40;
  const H = headerH + jerseyH + statsH + trophiesH + clubsHeaderH + clubsH + footerH;

  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0e2019");
  bg.addColorStop(1, "#071812");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(242,169,59,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  let y = 34;
  ctx.textAlign = "center";
  ctx.fillStyle = "#7fa08e";
  ctx.font = "600 12px sans-serif";
  ctx.fillText("SIMULADOR DE CARREIRA · BOLA DA SORTE", W / 2, y);

  y += 38;
  ctx.fillStyle = "#f2a93b";
  ctx.font = '700 40px "Teko", sans-serif';
  ctx.fillText(verdictFor(results), W / 2, y);

  y += 28;
  ctx.fillStyle = "#f3f0e6";
  ctx.font = "600 15px sans-serif";
  const lastAge = results.stops.length ? results.stops[results.stops.length - 1].endAge : 17;
  ctx.fillText(`17 → ${lastAge} anos · ${results.stops.length} clube(s)`, W / 2, y);

  if (includeSeed) {
    y += 18;
    ctx.fillStyle = "#4fd1c5";
    ctx.font = "600 11px sans-serif";
    ctx.fillText(`Seed: ${currentSeed}`, W / 2, y);
  }

  y += 20;
  const jerseyTop = y;
  drawJersey(ctx, W / 2, jerseyTop, 130, results.shirtNum ?? "-", currentPlayerName);
  ctx.fillStyle = "#f3f0e6";
  ctx.font = '600 20px "Rajdhani", sans-serif';
  ctx.fillText(results.shirtPos ?? "-", W / 2, jerseyTop + 130 * 1.1 + 28);

  y = headerH + jerseyH;
  const stats = [
    [results.matches, "PARTIDAS"],
    [results.gols, "GOLS"],
    [results.assis, "ASSISTÊNCIAS"],
  ];
  const statW = (W - 64) / 3;
  stats.forEach(([value, label], i) => {
    const sx = 32 + i * statW;
    roundRect(ctx, sx, y, statW - 10, statsH - 20, 10);
    ctx.fillStyle = "#142a21";
    ctx.fill();
    ctx.fillStyle = "#f2a93b";
    ctx.font = '700 32px "Teko", sans-serif';
    ctx.fillText(String(value ?? 0), sx + (statW - 10) / 2, y + 40);
    ctx.fillStyle = "#7fa08e";
    ctx.font = "600 10px sans-serif";
    ctx.fillText(label, sx + (statW - 10) / 2, y + 62);
  });

  y = headerH + jerseyH + statsH + 20;
  const trophyList = [
    ["NACIONAIS", results.nNacionais],
    ["INTERNACIONAIS", results.nInternacionais],
    ["CHAMPIONS", results.nChampions],
    ["MUNDIAIS", results.nWorldCup],
    ["BOLAS DE OURO", results.nBallonDor],
  ];
  ctx.font = "600 11px sans-serif";
  let tx = 32;
  const ty = y;
  trophyList.forEach(([label, count]) => {
    const won = count > 0;
    const text = `${label}: ${won ? count : "—"}`;
    const tw = ctx.measureText(text).width + 22;
    roundRect(ctx, tx, ty, tw, 26, 13);
    ctx.fillStyle = won ? "rgba(242,201,76,0.12)" : "rgba(255,255,255,0.03)";
    ctx.fill();
    ctx.strokeStyle = won ? "#f2c94c" : "#1d3a2c";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = won ? "#f2c94c" : "#7fa08e";
    ctx.fillText(text, tx + tw / 2, ty + 17);
    tx += tw + 8;
    if (tx > W - 100) {
      tx = 32;
    }
  });

  y = headerH + jerseyH + statsH + trophiesH;
  ctx.textAlign = "left";
  ctx.fillStyle = "#7fa08e";
  ctx.font = "700 12px sans-serif";
  ctx.fillText("TRAJETÓRIA", 32, y + 20);

  y += clubsHeaderH;
  ctx.font = '600 14px "Rajdhani", sans-serif';
  results.stops.forEach((stop, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const sx = 32 + col * colW;
    const sy = y + row * rowH;
    const range = stop.endAge > stop.startAge ? `${stop.startAge}–${stop.endAge}` : `${stop.startAge}`;
    ctx.fillStyle = "#f3f0e6";
    ctx.fillText(`${stop.flag} ${stop.name}`, sx, sy + 12);
    ctx.fillStyle = "#7fa08e";
    ctx.font = "500 12px sans-serif";
    ctx.fillText(range, sx, sy + 27);
    ctx.font = '600 14px "Rajdhani", sans-serif';
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#4a5f54";
  ctx.font = "500 10px sans-serif";
  ctx.fillText("bola da sorte — simulador de carreira", W / 2, H - 16);

  return canvas;
}

function sanitizeForFilename(name) {
  const cleaned = name.replace(/[^a-zA-Z0-9À-ÿ]+/g, "");
  return cleaned || "Jogador";
}

async function handleSaveImage() {
  const includeSeed = window.confirm("Quer mostrar a seed dessa carreira na imagem final?");

  saveImageBtn.disabled = true;
  const originalLabel = saveImageBtn.textContent;
  saveImageBtn.textContent = "Gerando imagem…";
  try {
    const canvas = await generateCareerImage(includeSeed);
    const link = document.createElement("a");
    link.download = `bola-da-sorte-carreira-${sanitizeForFilename(currentPlayerName)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    saveImageBtn.disabled = false;
    saveImageBtn.textContent = originalLabel;
  }
}

saveImageBtn.addEventListener("click", handleSaveImage);
