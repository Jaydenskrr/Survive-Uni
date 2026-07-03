/**
 * Shared app init — nav, todo demo, scroll reveals.
 * Person E can extend; motion follows Emil design-eng principles.
 */
(function () {
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.querySelectorAll(".todo-done-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".todo-item");
      if (!item || item.classList.contains("is-done")) return;
      item.classList.add("is-done");
      btn.textContent = "Done";
      btn.disabled = true;
    });
  });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.1 }
    );

    document.querySelectorAll(".event-card").forEach(function (card) {
      card.classList.add("reveal-on-scroll");
      observer.observe(card);
    });
  } else {
    document.querySelectorAll(".event-card").forEach(function (card) {
      card.classList.add("is-visible");
    });
  }

  var todayLabel = document.getElementById("today-date-label");
  if (todayLabel) {
    todayLabel.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
})();
