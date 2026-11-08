(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;
  // Never pause marquees — pausing them makes the loop look like it restarts.
  var nodes = document.querySelectorAll(".shop-orb, .scene-card");
  if (!nodes.length) return;
  var watch = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
    });
  });
  nodes.forEach(function (node) {
    watch.observe(node);
  });
})();
