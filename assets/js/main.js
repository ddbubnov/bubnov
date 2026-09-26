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

  var current = null;
  var hideTimer = null;
  var start = document.querySelector("[data-select-start]");

  function targetOf(el) {
    var t = el.getAttribute("data-select-target");
    return (t && el.querySelector(t)) || el;
  }

  function place(el, jump) {
    clearTimeout(hideTimer);
    if (!el) { sel.classList.remove("is-on"); current = null; return; }
    var t = targetOf(el);
    var r = t.getBoundingClientRect();
    var body = document.body.getBoundingClientRect();
    var pad = parseFloat(el.getAttribute("data-select-pad") || "0");

    sel.classList.toggle("is-jump", !!jump || !sel.classList.contains("is-on"));
    sel.style.transform = "translate(" + (r.left - body.left - pad) + "px," + (r.top - body.top - pad) + "px)";
    sel.style.width = r.width + pad * 2 + "px";
    sel.style.height = r.height + pad * 2 + "px";
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
