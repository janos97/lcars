/*! LCARS helpers v1.0.0 | MIT | https://github.com/janos97/lcars */
/*
 * lcars.js — optional, dependency-free helpers for the LCARS CSS.
 *
 * Everything is driven by data attributes, so it works with plain HTML and
 * with any framework that renders HTML:
 *
 *   data-lcars-clock            live 24h clock (data-lcars-clock="hm" hides seconds)
 *   data-lcars-stardate         today's stardate (YYYY.DDD)
 *   data-lcars-cascade="48"     fills a .lcars-data grid with animated numbers
 *   data-lcars-set-theme="x"    click to switch theme ("" = default)
 *   data-lcars-theme-select     on a <select>: lists every theme and switches on change
 *   data-lcars-toggle-alert     click to toggle red alert
 *   data-lcars-sound            on any ancestor: interactive children beep
 *                               (tap | confirm | deny | alert | red-alert | ready)
 *   data-lcars-tone="x"         per-element tone override
 *   .lcars-svg [role=button]    SVG controls get Enter/Space activation
 *   .lcars-meter[aria-valuenow] --lcars-value is kept in sync automatically
 *
 * Loading the module auto-initialises the page and watches for elements
 * added later (SPA friendly). Add data-lcars-manual to <html> to opt out and
 * call init(root) yourself.
 */

const hasDOM = typeof document !== "undefined";
const prefersReducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Theme catalogue ──────────────────────────────────────── */

/**
 * Every theme in themes.css, in the same order (a test keeps them in sync).
 * `id` is the data-lcars-theme value.
 */
export const THEMES = Object.freeze([
  { id: "tng", name: "The Next Generation", era: "2364–2370", note: "Canonical LCARS; the default" },
  { id: "tos", name: "The Original Series", era: "2265–2269", note: "Pre-LCARS primaries, squarer corners" },
  { id: "snw", name: "Strange New Worlds", era: "2259–", note: "Retro-modern gold, teal, red" },
  { id: "dis", name: "Discovery", era: "2256–3191", note: "Silver-blue, thin bars" },
  { id: "ent", name: "Enterprise", era: "2151–2155", note: "Gunmetal and amber, near-square corners" },
  { id: "ds9", name: "Deep Space Nine", era: "2369–2375", note: "Rust, tan, dusty lavender" },
  { id: "voy", name: "Voyager", era: "2371–2378", note: "Peach, gold, blue-lilac" },
  { id: "nemesis", name: "TNG films (First Contact–Nemesis)", era: "2373–2379", note: "Sovereign-class blues" },
  { id: "ld", name: "Lower Decks", era: "2380–", note: "Bright, high contrast" },
  { id: "pro", name: "Prodigy", era: "2383–", note: "Violet, teal, orange" },
  { id: "pic", name: "Picard", era: "2399–2401", note: "Slate blue, slimmer bars" },
  { id: "red-alert", name: "Red alert", era: "any", note: "Condition red; use setAlert()" },
]);

/* ── Pure helpers ─────────────────────────────────────────── */

/** Stardate in the YYYY.DDD form (year + zero-padded day of the year). */
export function stardate(date = new Date()) {
  const year = date.getFullYear();
  const day = Math.round((Date.UTC(year, date.getMonth(), date.getDate()) - Date.UTC(year, 0, 1)) / 864e5) + 1;
  return `${year}.${String(day).padStart(3, "0")}`;
}

/** 24-hour clock string: HH:MM:SS, or HH:MM when seconds is false. */
export function clock(date = new Date(), { seconds = true } = {}) {
  const parts = [date.getHours(), date.getMinutes()];
  if (seconds) parts.push(date.getSeconds());
  return parts.map((n) => String(n).padStart(2, "0")).join(":");
}

/** A random LCARS-looking number: "47", "0916", "21-8840", "3.1415"… */
export function randomReadout(random = Math.random) {
  const digits = (n) => Array.from({ length: n }, () => Math.floor(random() * 10)).join("");
  const shape = random();
  if (shape < 0.35) return digits(1 + Math.floor(random() * 3));
  if (shape < 0.7) return digits(4);
  if (shape < 0.88) return `${digits(2)}-${digits(4)}`;
  return `${digits(1)}.${digits(3)}`;
}

/* ── Sound ────────────────────────────────────────────────── */

// Semantic console sounds (the event set follows upstream's lcars_audio.js):
// tap = acknowledge, confirm = alternate acknowledge, deny = negative
// acknowledge, alert, red-alert and ready. Each is synthesized, so no audio
// files ship with the framework; setSounds() swaps in your own samples.
// Segments are [hz, seconds] or [fromHz, toHz, seconds] for a sweep.
const TONES = {
  tap: [[1400, 0.06]],
  confirm: [[1000, 0.06], [1500, 0.08]],
  deny: [[420, 0.1], [300, 0.14]],
  alert: [[880, 0.12], [660, 0.12], [880, 0.12], [660, 0.12]],
  "red-alert": [[380, 900, 0.45], [380, 900, 0.45]],
  ready: [[700, 0.05], [1050, 0.05], [1400, 0.09]],
};

/** Names of the built-in tones. */
export const SOUNDS = Object.freeze(Object.keys(TONES));

const samples = new Map(); // tone → { url, el }
let audio;

/**
 * Use your own audio files instead of the synthesized tones, e.g.
 * setSounds({ tap: "/sfx/tap.ogg", "red-alert": "/sfx/klaxon.ogg" }).
 * Pass null for a tone to go back to its synthesized version.
 */
export function setSounds(map) {
  for (const [tone, url] of Object.entries(map)) {
    if (url) samples.set(tone, { url, el: null });
    else samples.delete(tone);
  }
}

/** Play a console sound. Silently no-ops where audio is unavailable or blocked. */
export function beep(tone = "tap", { volume = 0.04 } = {}) {
  if (typeof window === "undefined") return;
  const sample = samples.get(tone);
  if (sample && typeof Audio === "function") {
    sample.el ??= new Audio(sample.url);
    sample.el.currentTime = 0;
    sample.el.play()?.catch?.(() => {});
    return;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audio ??= new Ctx();
  let t = audio.currentTime;
  for (const segment of TONES[tone] ?? TONES.tap) {
    const [from, to, dur] = segment.length === 3 ? segment : [segment[0], segment[0], segment[1]];
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, t);
    if (to !== from) osc.frequency.linearRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + dur);
    t += dur;
  }
}

/* ── Theme & alert ────────────────────────────────────────── */

const root = () => document.documentElement;

/** Switch theme on `el` (default <html>). Pass "" or null for the default. */
export function setTheme(name, el = root()) {
  if (name) el.dataset.lcarsTheme = name;
  else delete el.dataset.lcarsTheme;
  syncSelects();
  el.dispatchEvent(new CustomEvent("lcars:theme", { bubbles: true, detail: { theme: name || null } }));
}

/** Enter or leave red alert on `el`. Restores the previous theme on exit. */
export function setAlert(on, el = root()) {
  const active = el.hasAttribute("data-lcars-alert");
  on = on ?? !active;
  if (on === active) return on;
  if (on) {
    el.dataset.lcarsPrevTheme = el.dataset.lcarsTheme ?? "";
    el.setAttribute("data-lcars-alert", "");
    el.dataset.lcarsTheme = "red-alert";
    syncSelects();
  } else {
    el.removeAttribute("data-lcars-alert");
    setTheme(el.dataset.lcarsPrevTheme, el);
    delete el.dataset.lcarsPrevTheme;
  }
  el.dispatchEvent(new CustomEvent("lcars:alert", { bubbles: true, detail: { active: on } }));
  return on;
}

/* ── Live elements ────────────────────────────────────────── */

const selects = new Set();

function syncSelects() {
  if (!hasDOM) return;
  const current = document.documentElement.dataset.lcarsTheme || "tng";
  for (const sel of selects) {
    if (sel.isConnected) sel.value = current;
    else selects.delete(sel);
  }
}

function startThemeSelect(el) {
  if (!el.options.length) {
    for (const t of THEMES) el.add(new Option(`${t.id.toUpperCase()} · ${t.name}`, t.id));
  }
  selects.add(el);
  syncSelects();
}

const clocks = new Set();
let ticker = null;

function renderClock(el) {
  const now = new Date();
  if (el.hasAttribute("data-lcars-stardate")) el.textContent = stardate(now);
  else el.textContent = clock(now, { seconds: el.dataset.lcarsClock !== "hm" });
}

function tick() {
  for (const el of clocks) {
    if (el.isConnected) renderClock(el);
    else release(el);
  }
  if (!clocks.size) {
    clearInterval(ticker);
    ticker = null;
  }
}

function startClock(el) {
  renderClock(el);
  clocks.add(el);
  ticker ??= setInterval(tick, 1000);
}

function startCascade(el) {
  const count = Number.parseInt(el.dataset.lcarsCascade, 10) || 48;
  if (el.children.length === 0) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const cell = document.createElement("span");
      cell.textContent = randomReadout();
      frag.append(cell);
    }
    el.append(frag);
  }
  el.setAttribute("aria-hidden", "true");
  if (prefersReducedMotion()) return;

  const timer = setInterval(() => {
    if (!el.isConnected) return clearInterval(timer), release(el);
    const cells = el.children;
    for (let i = 0; i < 3; i++) {
      const cell = cells[Math.floor(Math.random() * cells.length)];
      if (!cell) return;
      cell.textContent = randomReadout();
      cell.classList.add("is-hot");
      setTimeout(() => cell.classList.remove("is-hot"), 450);
    }
  }, 350);
}

function syncMeter(el) {
  const now = Number.parseFloat(el.getAttribute("aria-valuenow"));
  const min = Number.parseFloat(el.getAttribute("aria-valuemin") ?? "0");
  const max = Number.parseFloat(el.getAttribute("aria-valuemax") ?? "100");
  if (Number.isFinite(now) && max > min) el.style.setProperty("--lcars-value", String((now - min) / (max - min)));
}

let meterObserver;
function watchMeter(el) {
  syncMeter(el);
  meterObserver ??= new MutationObserver((records) => records.forEach((r) => syncMeter(r.target)));
  meterObserver.observe(el, { attributes: true, attributeFilter: ["aria-valuenow", "aria-valuemin", "aria-valuemax"] });
}

// Detached elements are released so they upgrade again if re-inserted.
function release(el) {
  clocks.delete(el);
  upgraded.delete(el);
}

const UPGRADES = [
  ["[data-lcars-clock], [data-lcars-stardate]", startClock],
  ["[data-lcars-cascade]", startCascade],
  [".lcars-meter[aria-valuenow]", watchMeter],
  ["select[data-lcars-theme-select]", startThemeSelect],
];
const upgraded = new WeakSet();

function upgrade(scope) {
  for (const [selector, fn] of UPGRADES) {
    const found = [...scope.querySelectorAll(selector)];
    if (scope.matches?.(selector)) found.unshift(scope);
    for (const el of found) {
      if (upgraded.has(el)) continue;
      upgraded.add(el);
      fn(el);
    }
  }
}

/* ── Delegated clicks ─────────────────────────────────────── */

function onClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const themeBtn = target.closest("[data-lcars-set-theme]");
  if (themeBtn) setTheme(themeBtn.dataset.lcarsSetTheme);

  const alertBtn = target.closest("[data-lcars-toggle-alert]");
  const alertOn = alertBtn ? setAlert() : null;

  const soundScope = target.closest("[data-lcars-sound]");
  const interactive = target.closest("a[href], button, [role='button'], summary, label, input, select");
  if (soundScope && interactive && soundScope.dataset.lcarsSound !== "off" && !isDisabled(interactive)) {
    const fallback = alertOn === true ? "red-alert" : soundScope.dataset.lcarsSound || "tap";
    beep(interactive.dataset.lcarsTone || fallback);
  }
}

const isDisabled = (el) => el.matches(":disabled, [aria-disabled='true']");

// SVG shapes can't be <button>s, so .lcars-svg shapes with role="button"
// get the keyboard behaviour a button has: Enter or Space clicks them.
function onKeydown(event) {
  const el = event.target;
  if (!(el instanceof Element) || !el.matches(".lcars-svg [role='button']")) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  if (!isDisabled(el)) el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

function onChange(event) {
  const el = event.target;
  if (!(el instanceof Element) || !el.matches("select[data-lcars-theme-select]")) return;
  if (el.value === "red-alert") setAlert(true);
  else {
    setAlert(false);
    setTheme(el.value === "tng" ? "" : el.value);
  }
}

let listening = false;

/**
 * Upgrade LCARS elements inside `scope` (default: document). Safe to call
 * repeatedly — elements are only upgraded once.
 */
export function init(scope = document) {
  if (!hasDOM) return;
  if (!listening) {
    document.addEventListener("click", onClick);
    document.addEventListener("change", onChange);
    document.addEventListener("keydown", onKeydown);
    listening = true;
  }
  upgrade(scope);
}

/* ── Auto-init ────────────────────────────────────────────── */

if (hasDOM && !document.documentElement.hasAttribute("data-lcars-manual")) {
  const start = () => {
    init(document);
    new MutationObserver((records) => {
      for (const r of records) for (const node of r.addedNodes) if (node.nodeType === 1) upgrade(node);
    }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}

const LCARS = { init, setTheme, setAlert, beep, setSounds, SOUNDS, stardate, clock, randomReadout, THEMES };
if (typeof window !== "undefined") window.LCARS ??= LCARS;
export default LCARS;
