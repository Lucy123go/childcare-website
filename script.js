(function () {
  var plan = 19000;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return "NT$ " + n.toLocaleString("en-US"); };

  function update() {
    var sub = +$("sub").value, mon = +$("mon").value;
    var pay = Math.max(plan - sub, 0);
    $("subOut").textContent = sub.toLocaleString("en-US");
    $("monOut").textContent = mon + " 個月";
    $("rMonth").textContent = fmt(pay);
    $("rTotal").textContent = fmt(pay * mon);
    $("rSaved").textContent = fmt(Math.min(sub, plan) * mon);
  }

  document.querySelectorAll(".seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".seg button").forEach(function (x) {
        x.classList.remove("on");
        x.setAttribute("aria-checked", "false");
      });
      b.classList.add("on");
      b.setAttribute("aria-checked", "true");
      plan = +b.dataset.plan;
      update();
    });
  });
  $("sub").addEventListener("input", update);
  $("mon").addEventListener("input", update);
  update();
})();
