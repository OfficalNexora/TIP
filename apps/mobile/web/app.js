function setToday() {
  const label = document.getElementById("todayLabel");
  if (!label) return;
  const now = new Date();
  label.textContent = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function setRing(value) {
  const ring = document.getElementById("riskRing");
  const riskValue = document.getElementById("riskValue");
  if (!ring || !riskValue) return;
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  ring.style.setProperty("--percent", String(safeValue));
  riskValue.textContent = String(safeValue);
}

function rotateSnapshot() {
  const snapshots = [
    { trust: 72, patterns: "08", reviews: "03", scans: "19", status: "Sync Ready" },
    { trust: 64, patterns: "11", reviews: "05", scans: "22", status: "2 Alerts" },
    { trust: 81, patterns: "04", reviews: "02", scans: "17", status: "Stable" },
  ];

  const pick = snapshots[Math.floor(Date.now() / 8000) % snapshots.length];
  setRing(pick.trust);

  const pattern = document.getElementById("patternCount");
  const review = document.getElementById("reviewCount");
  const scan = document.getElementById("scanCount");
  const status = document.getElementById("statusLabel");

  if (pattern) pattern.textContent = pick.patterns;
  if (review) review.textContent = pick.reviews;
  if (scan) scan.textContent = pick.scans;
  if (status) status.textContent = pick.status;
}

setToday();
rotateSnapshot();
setInterval(rotateSnapshot, 8000);
