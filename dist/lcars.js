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
 *   data-lcars-toggle-alert     click to toggle red alert
 *   data-lcars-sound            on any ancestor: interactive children beep
 *                               (value picks the tone: tap | confirm | deny)
 *   .lcars-meter[aria-valuenow] --lcars-value is kept in sync automatically
 *
 * Loading the module auto-initialises the page and watches for elements
 * added later (SPA friendly). Add data-lcars-manual to <html> to opt out and
 * call init(root) yourself.
 */

const hasDOM = typeof document !== "undefined";
const prefersReducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

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

const TONES = {
  tap: [[1400, 0.06]],
  confirm: [[1000, 0.06], [1500, 0.08]],
  deny: [[420, 0.1], [300, 0.14]],
};
let audio;

/** Play a short synthesized console tone. Silently no-ops without Web Audio. */
export function beep(tone = "tap", { volume = 0.04 } = {}) {
  const Ctx = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return;
  audio ??= new Ctx();
  let t = audio.currentTime;
  for (const [freq, dur] of TONES[tone] ?? TONES.tap) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
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
  } else {
    el.removeAttribute("data-lcars-alert");
    setTheme(el.dataset.lcarsPrevTheme, el);
    delete el.dataset.lcarsPrevTheme;
  }
  el.dispatchEvent(new CustomEvent("lcars:alert", { bubbles: true, detail: { active: on } }));
  return on;
}

/* ── Live elements ────────────────────────────────────────── */

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

  if (target.closest("[data-lcars-toggle-alert]")) setAlert();

  const soundScope = target.closest("[data-lcars-sound]");
  const interactive = target.closest("a[href], button, [role='button'], summary, label, input, select");
  if (soundScope && interactive && soundScope.dataset.lcarsSound !== "off" && !interactive.matches(":disabled")) {
    beep(interactive.dataset.lcarsTone || soundScope.dataset.lcarsSound || "tap");
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

const LCARS = { init, setTheme, setAlert, beep, stardate, clock, randomReadout };
if (typeof window !== "undefined") window.LCARS ??= LCARS;
export default LCARS;
