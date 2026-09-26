/*
  Рамка выделения, как в редакторе.
  Любой элемент с атрибутом data-select можно «выделить»:
  - мышью — наведение,
  - с клавиатуры — фокус (Tab),
  - на телефоне — элемент, который сейчас в центре экрана.
  data-select-target=".artboard" — выделить не сам элемент, а вложенный.
  data-select-pad="8" — отступ рамки от элемента, px.
  Элемент с data-select-start выделяется при загрузке страницы.
*/
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-select]"));
  if (!items.length) return;

  var sel = document.createElement("div");
  sel.className = "sel";
  sel.setAttribute("aria-hidden", "true");
  sel.innerHTML = '<i></i><i></i><i></i><i></i><span class="sel__size"></span>';
  document.body.appendChild(sel);
  var size = sel.querySelector(".sel__size");

  // курсор соавтора: держится у правого нижнего угла рамки
  var collab = document.createElement("div");
  collab.className = "collab";
  collab.setAttribute("aria-hidden", "true");
  collab.innerHTML = '<svg viewBox="0 0 20 20"><path d="M3 2l13 7-5.6 1.4L8 16z" fill="var(--collab)" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg><span>Даниил</span>';
  document.body.appendChild(collab);

  var current = null;
  var hideTimer = null;
  var start = document.querySelector("[data-select-start]");

  function targetOf(el) {
    var t = el.getAttribute("data-select-target");
    return (t && el.querySelector(t)) || el;
  }

  function place(el, jump) {
    clearTimeout(hideTimer);
    if (!el) { sel.classList.remove("is-on"); collab.classList.remove("is-on"); current = null; return; }
    var t = targetOf(el);
    var r = t.getBoundingClientRect();
    var body = document.body.getBoundingClientRect();
    var pad = parseFloat(el.getAttribute("data-select-pad") || "0");

    sel.classList.toggle("is-jump", !!jump || !sel.classList.contains("is-on"));
    sel.style.transform = "translate(" + (r.left - body.left - pad) + "px," + (r.top - body.top - pad) + "px)";
    sel.style.width = r.width + pad * 2 + "px";
    sel.style.height = r.height + pad * 2 + "px";
    var cx = Math.min(r.right - body.left + pad + 2, document.documentElement.clientWidth - 96), cy = r.bottom - body.top + pad + 2;
    if (!collab.classList.contains("is-on")) collab.style.transform = "translate(" + (cx + 60) + "px," + (cy + 80) + "px)";
    void collab.offsetWidth;
    collab.style.transform = "translate(" + cx + "px," + cy + "px)";
    collab.classList.add("is-on");
    size.textContent = Math.round(r.width) + " \u00d7 " + Math.round(r.height);
    // перерисовка, чтобы следующий переход был плавным
    void sel.offsetWidth;
    sel.classList.remove("is-jump");
    sel.classList.add("is-on");
    current = el;
  }

  function release() {
    hideTimer = setTimeout(function () { place(start || null); }, 140);
  }

  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  items.forEach(function (el) {
    if (canHover) {
      el.addEventListener("mouseenter", function () { place(el); });
      el.addEventListener("mouseleave", release);
    }
    el.addEventListener("focusin", function () { place(el); });
    el.addEventListener("focusout", release);
  });

  if (!canHover && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) place(e.target); });
    }, { rootMargin: "-40% 0px -40% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  function refresh() { if (current) place(current, true); }
  window.addEventListener("resize", refresh);
  if ("ResizeObserver" in window) new ResizeObserver(refresh).observe(document.body);

  // первое выделение — после загрузки шрифтов, чтобы размеры были точными
  var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(function () {
    if (start && !current) setTimeout(function () { place(start); }, 350);
  });
})();


/* Часы в строке меню — московское время, как в macOS */
(function () {
  var el = document.querySelector(".clock");
  if (!el) return;
  var fmt = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow", weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit"
  });
  function tick() {
    var p = {};
    fmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var wd = p.weekday.charAt(0).toUpperCase() + p.weekday.slice(1);
    el.textContent = wd + " " + p.day + " " + p.month + " " + p.hour + ":" + p.minute;
  }
  tick();
  setInterval(tick, 15000);
})();

/* Меню: открыто только одно; при открытом меню соседние открываются наведением, как в macOS */
(function () {
  var menus = Array.prototype.slice.call(document.querySelectorAll(".menu"));
  if (!menus.length) return;
  function closeAll(except) {
    menus.forEach(function (m) { if (m !== except) m.removeAttribute("open"); });
  }
  menus.forEach(function (m) {
    m.addEventListener("toggle", function () { if (m.open) closeAll(m); });
    m.querySelector("summary").addEventListener("mouseenter", function () {
      if (menus.some(function (x) { return x.open; }) && !m.open) { closeAll(m); m.setAttribute("open", ""); }
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".menu")) closeAll(null);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var open = menus.filter(function (m) { return m.open; })[0];
      if (open) { open.removeAttribute("open"); open.querySelector("summary").focus(); }
    }
  });
})();
