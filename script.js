(function () {
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---------- 天空：依捲動進度從清晨走到夜晚 ---------- */
  var stops = [
    [0,    "#cfe6d3", "#fdf1d3"],
    [0.35, "#bfe0cf", "#f8f3dc"],
    [0.7,  "#f3d49c", "#f1b98a"],
    [1,    "#33415a", "#5d5470"]
  ];
  var hex = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); };
  var mix = function (a, b, t) {
    var x = hex(a), y = hex(b);
    return "rgb(" + x.map(function (v, i) { return Math.round(v + (y[i] - v) * t); }).join(",") + ")";
  };
  function sky(p) {
    for (var i = 0; i < stops.length - 1; i++) {
      if (p <= stops[i + 1][0]) {
        var t = (p - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
        root.style.setProperty("--sky1", mix(stops[i][1], stops[i + 1][1], t));
        root.style.setProperty("--sky2", mix(stops[i][2], stops[i + 1][2], t));
        return;
      }
    }
  }

  /* ---------- 森林剪影 ---------- */
  function seeded(n) { var s = n; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function forest(id, seed, color, minH, maxH, step) {
    var r = seeded(seed), W = 1600, H = 300, d = "";
    for (var x = -40; x < W + 40; x += step * (0.7 + r() * 0.6)) {
      var h = minH + r() * (maxH - minH), w = 36 + r() * 40, base = H;
      if (r() > 0.35) { // 針葉樹
        d += "M" + (x - w / 2) + " " + base + "L" + x + " " + (base - h) + "L" + (x + w / 2) + " " + base + "Z";
        d += "M" + (x - w * .4) + " " + (base - h * .35) + "L" + x + " " + (base - h * 1.05) + "L" + (x + w * .4) + " " + (base - h * .35) + "Z";
      } else { // 圓樹
        d += "M" + (x - w * .6) + " " + base + "L" + (x - w * .6) + " " + (base - h * .55) + "Q" + x + " " + (base - h * 1.2) + " " + (x + w * .6) + " " + (base - h * .55) + "L" + (x + w * .6) + " " + base + "Z";
      }
    }
    var svg = $(id);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.innerHTML = '<path d="' + d + '" fill="' + color + '"/>';
  }
  forest("t1", 3, "#7da587", 120, 240, 60);
  forest("t2", 7, "#5f8f62", 100, 210, 54);
  forest("t3", 11, "#3f6b49", 80, 170, 48);

  /* ---------- 粒子：飄落的葉子與夜晚螢火蟲 ---------- */
  var cv = $("fx"), cx = cv.getContext("2d"), W = 0, H = 0, night = 0, parts = [];
  function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; }
  resize(); addEventListener("resize", resize);
  var leafColors = ["#8fb780", "#6aa072", "#e9b44c", "#f2c6c0"];
  for (var i = 0; i < 22; i++) parts.push({
    leaf: true, x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    s: 5 + Math.random() * 6, vy: 0.3 + Math.random() * 0.5, ph: Math.random() * 6,
    rot: Math.random() * 6, c: leafColors[i % 4]
  });
  for (var j = 0; j < 26; j++) parts.push({
    leaf: false, x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    s: 2 + Math.random() * 2.5, ph: Math.random() * 6
  });
  var tick = 0;
  function frame() {
    tick += 0.01; cx.clearRect(0, 0, W, H);
    parts.forEach(function (p) {
      if (p.leaf) {
        p.y += p.vy; p.x += Math.sin(tick * 2 + p.ph) * 0.6; p.rot += 0.01;
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.globalAlpha = 0.75 - night * 0.45;
        cx.fillStyle = p.c; cx.beginPath(); cx.ellipse(0, 0, p.s, p.s * .5, 0, 0, 6.3); cx.fill(); cx.restore();
      } else if (night > 0.05) {
        p.x += Math.sin(tick * 1.5 + p.ph) * 0.4; p.y += Math.cos(tick * 1.2 + p.ph) * 0.3;
        var a = (0.4 + 0.6 * Math.abs(Math.sin(tick * 2 + p.ph))) * night;
        var g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 5);
        g.addColorStop(0, "rgba(255,230,140," + a + ")"); g.addColorStop(1, "rgba(255,230,140,0)");
        cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, p.s * 5, 0, 6.3); cx.fill();
      }
    });
    requestAnimationFrame(frame);
  }
  if (!reduce) frame();

  /* ---------- 捲動：天空、視差、時間軸 ---------- */
  var tl = $("timeline"), tlItems = tl.querySelectorAll("li");
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    var y = scrollY, p = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
    sky(p);
    night = Math.min(Math.max((p - 0.72) / 0.2, 0), 1);
    if (!reduce) {
      $("t1").style.transform = "translateY(" + (p * 40) + "px)";
      $("t2").style.transform = "translateY(" + (p * 20) + "px)";
      $("t3").style.transform = "translateY(" + (-p * 10) + "px)";
      $("glow").style.transform = "translate(" + (-p * 70) + "vw," + (p * 40) + "vh)";
    }
    var r = tl.getBoundingClientRect(), line = innerHeight * 0.6;
    var pr = Math.min(Math.max((line - r.top) / r.height, 0), 1);
    tl.style.setProperty("--prog", (pr * 100) + "%");
    tlItems.forEach(function (li) { li.classList.toggle("lit", li.getBoundingClientRect().top < line); });
  }
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); onScroll();

  /* ---------- 捲動出現 ---------- */
  var ro = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { ro.observe(el); });
  document.querySelector(".hero").classList.add("reveal", "in");

  /* ---------- 森林通行證：走過一關蓋一章 ---------- */
  var levels = [].slice.call(document.querySelectorAll(".level")), got = {};
  try { got = JSON.parse(localStorage.getItem("stamps") || "{}"); } catch (e) {}
  var box = $("stamps");
  levels.forEach(function (lv) {
    var s = lv.dataset.stamp.split("|"), b = document.createElement("button");
    b.className = "stamp"; b.dataset.id = lv.id; b.title = s[1];
    b.innerHTML = "<div><span>" + s[0] + "</span><small>" + s[1] + "</small></div>";
    b.addEventListener("click", function () { lv.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); });
    box.appendChild(b);
  });
  function paint(bump) {
    var n = 0;
    box.querySelectorAll(".stamp").forEach(function (b) { var on = !!got[b.dataset.id]; n += on; b.classList.toggle("got", on); });
    $("ppCount").textContent = n + "/" + levels.length;
    if (bump) { var pb = $("ppBtn"); pb.classList.remove("bump"); void pb.offsetWidth; pb.classList.add("bump"); }
  }
  var so = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting && !got[e.target.id]) {
        got[e.target.id] = 1;
        try { localStorage.setItem("stamps", JSON.stringify(got)); } catch (x) {}
        paint(true);
      }
    });
  }, { threshold: 0.45 });
  levels.forEach(function (lv) { so.observe(lv); });
  paint(false);
  function togglePanel(open) { $("ppPanel").hidden = !open; $("ppBtn").setAttribute("aria-expanded", open); }
  $("ppBtn").addEventListener("click", function () { togglePanel($("ppPanel").hidden); });
  $("ppClose").addEventListener("click", function () { togglePanel(false); });

  /* ---------- 費用試算 ---------- */
  var plan = 19000, fmt = function (n) { return "NT$ " + n.toLocaleString("en-US"); };
  function calc() {
    var sub = +$("sub").value, mon = +$("mon").value, pay = Math.max(plan - sub, 0);
    $("subOut").textContent = sub.toLocaleString("en-US");
    $("monOut").textContent = mon + " 個月";
    $("rMonth").textContent = fmt(pay);
    $("rTotal").textContent = fmt(pay * mon);
    $("rSaved").textContent = fmt(Math.min(sub, plan) * mon);
    $("barFull").style.width = "100%"; $("barFullT").textContent = fmt(plan);
    $("barPay").style.width = (pay / plan * 100) + "%"; $("barPayT").textContent = fmt(pay);
  }
  document.querySelectorAll(".seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".seg button").forEach(function (x) { x.classList.remove("on"); x.setAttribute("aria-checked", "false"); });
      b.classList.add("on"); b.setAttribute("aria-checked", "true"); plan = +b.dataset.plan; calc();
    });
  });
  $("sub").addEventListener("input", calc); $("mon").addEventListener("input", calc);
  calc();
})();
