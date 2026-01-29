window.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const hue = Math.floor(Math.random() * 360);
  const oppositeHue = (hue + 180) % 360;

  const accent = `hsl(${hue} 70% 55%)`;
  const accentSoft = `hsla(${hue} 70% 55% / 0.2)`;
  const surface = `hsl(${oppositeHue} 35% 18%)`;
  const text = `hsl(${hue} 70% 85%)`;
  const bg = `radial-gradient(circle at top left, hsl(${oppositeHue} 35% 24%), hsl(${oppositeHue} 35% 12%) 55%, hsl(${oppositeHue} 35% 8%))`;

  root.style.setProperty("--error-accent", accent);
  root.style.setProperty("--error-accent-soft", accentSoft);
  root.style.setProperty("--error-surface", surface);
  root.style.setProperty("--error-text", text);
  root.style.setProperty("--error-bg", bg);
});
