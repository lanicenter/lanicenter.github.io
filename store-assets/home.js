(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function endBoot() {
    document.body.classList.remove("is-booting");
    var boot = document.getElementById("boot");
    if (!boot) return;
    window.setTimeout(function () {
      if (boot.parentNode) boot.parentNode.removeChild(boot);
    }, 600);
  }
  if (reduce) endBoot();
  else {
    var bootDone = false;
    function finishBoot() {
      if (bootDone) return;
      bootDone = true;
      endBoot();
    }
    window.setTimeout(finishBoot, 900);
    window.addEventListener("load", function () {
      window.setTimeout(finishBoot, 180);
    });
  }

  var remeasureMarquees = [];

  function startMarquee(track, speed) {
    if (!track || reduce) return;
    var sets = track.querySelectorAll(".loop-set");
    if (sets.length < 2) return;
    while (sets.length < 3) {
      track.appendChild(sets[0].cloneNode(true));
      sets = track.querySelectorAll(".loop-set");
    }
    track.classList.add("js-marquee");
    var x = 0;
    var last = performance.now();
    var setWidth = 0;
    function measure() {
      var hidden = track.getClientRects().length === 0;
      if (hidden) return;
      var next = sets[0].getBoundingClientRect().width;
      if (next > 1) setWidth = next;
    }
    measure();
    remeasureMarquees.push(measure);
    window.addEventListener("resize", measure);
    function tick(now) {
      var dt = Math.min(40, now - last);
      last = now;
      if (setWidth > 1 && track.getClientRects().length) {
        x -= (speed * dt) / 1000;
        while (x <= -setWidth) x += setWidth;
        track.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("lani-lang", function () {
    requestAnimationFrame(function () {
      remeasureMarquees.forEach(function (measure) { measure(); });
    });
  });

  document.querySelectorAll(".marquee-track").forEach(function (track) {
    startMarquee(track, 40);
  });
  document.querySelectorAll(".partner-track").forEach(function (track) {
    startMarquee(track, 34);
  });

  var story = document.querySelector(".story");
  var pin = document.querySelector(".story-pin");
  var beats = Array.prototype.slice.call(document.querySelectorAll(".story-beat"));
  var scenes = Array.prototype.slice.call(document.querySelectorAll(".flow-scene"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".dots a"));
  var line = document.querySelector(".scroll-line span");
  var canvas = document.getElementById("flow-canvas");
  var orbit = document.querySelector(".flow-orbit");
  var stepCount = Math.max(beats.length, 1);
  var liveRoot = document.getElementById("flow-live");
  var liveClips = liveRoot
    ? Array.prototype.slice.call(liveRoot.querySelectorAll(".flow-live-clip"))
    : [];
  // One royalty-free Mixkit clip per story chapter (matched to the section).
  var liveSources = [
    "https://assets.mixkit.co/videos/991/991-720.mp4",       // 0 Start — busy market
    "https://assets.mixkit.co/videos/6302/6302-720.mp4",     // 1 Shop — retail / shopping
    "https://assets.mixkit.co/videos/42721/42721-720.mp4",   // 2 App — phone in hand
    "https://assets.mixkit.co/videos/34317/34317-720.mp4",   // 3 Pay — card / payment
    "https://assets.mixkit.co/videos/49878/49878-720.mp4",   // 4 Soon — city night
  ];
  var liveIndex = -1;
  var liveSlot = 0;
  var liveToken = 0;

  function playClip(video) {
    if (!video) return;
    var play = video.play();
    if (play && typeof play.catch === "function") play.catch(function () {});
  }

  function loadLive(slot, src, token, onReady) {
    var video = liveClips[slot];
    if (!video) return;
    if (video.dataset.src === src && video.readyState >= 2) {
      if (onReady) onReady(video);
      return;
    }
    video.dataset.src = src;
    video.src = src;
    video.load();
    var done = function () {
      video.removeEventListener("loadeddata", done);
      if (token !== liveToken) return;
      if (onReady) onReady(video);
    };
    video.addEventListener("loadeddata", done);
  }

  function setLiveScene(index) {
    if (reduce || liveClips.length < 2 || !liveSources.length) return;
    var next = Math.max(0, Math.min(liveSources.length - 1, index | 0));
    if (next === liveIndex) return;
    liveIndex = next;
    liveToken += 1;
    var token = liveToken;
    var src = liveSources[next];
    var incoming = 1 - liveSlot;
    loadLive(incoming, src, token, function () {
      if (token !== liveToken) return;
      liveClips.forEach(function (clip, i) {
        var on = i === incoming;
        clip.classList.toggle("is-on", on);
        if (on) playClip(clip);
        else clip.pause();
      });
      liveSlot = incoming;
      var prefetch = liveSources[Math.min(liveSources.length - 1, next + 1)];
      if (prefetch && prefetch !== src) loadLive(1 - liveSlot, prefetch, token);
    });
  }

  function setBeat(progress) {
    var pos = progress * (stepCount - 1);
    var active = Math.round(pos);
    beats.forEach(function (beat, i) {
      var d = Math.abs(pos - i);
      var strength = d < 0.78 ? Math.max(0, 1 - d / 0.78) : 0;
      beat.style.opacity = String(strength);
      beat.style.transform = "translate3d(0," + ((1 - strength) * 22).toFixed(1) + "px,0)";
      beat.style.pointerEvents = strength > 0.55 ? "auto" : "none";
      beat.classList.toggle("is-on", i === active);
    });
    scenes.forEach(function (scene, i) {
      var d = Math.abs(pos - i);
      var strength = d < 0.9 ? Math.max(0, 1 - d / 0.9) : 0;
      scene.style.opacity = String(strength);
      scene.style.visibility = strength > 0.02 ? "visible" : "hidden";
      scene.style.transform = "translate3d(0," + ((1 - strength) * 36).toFixed(1) + "px,0) scale(" + (0.94 + strength * 0.06).toFixed(3) + ")";
      scene.classList.toggle("is-on", i === active);
    });
    dots.forEach(function (link) {
      var step = Number(link.getAttribute("data-step"));
      if (step === active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (line) line.style.transform = "scaleX(" + progress + ")";
    if (orbit) orbit.style.setProperty("--spin", String(progress * 360));
    setLiveScene(active);
  }

  if (!reduce && liveClips.length) setLiveScene(0);

  // 60fps soft particle field behind the story.
  var particles = [];
  var ctx = null;
  var dpr = 1;
  var canvasW = 0;
  var canvasH = 0;
  var flowProgress = 0;

  function resizeCanvas() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasW = canvas.clientWidth;
    canvasH = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(canvasW * dpr));
    canvas.height = Math.max(1, Math.floor(canvasH * dpr));
    ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!particles.length) {
      var count = Math.round(Math.min(90, Math.max(42, canvasW / 18)));
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvasW,
          y: Math.random() * canvasH,
          r: 1.2 + Math.random() * 3.4,
          s: 0.15 + Math.random() * 0.55,
          a: 0.12 + Math.random() * 0.35,
          p: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  function paintCanvas(now) {
    if (!ctx || !canvasW) return;
    ctx.clearRect(0, 0, canvasW, canvasH);
    var t = now * 0.001;
    var hueShift = 210 + flowProgress * 18;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var y = (p.y - t * p.s * 28 - flowProgress * 120) % (canvasH + 40);
      if (y < 0) y += canvasH + 40;
      var x = p.x + Math.sin(t * 0.7 + p.p) * 18;
      var grad = ctx.createRadialGradient(x, y, 0, x, y, p.r * 6);
      grad.addColorStop(0, "hsla(" + hueShift + ",90%,62%," + p.a + ")");
      grad.addColorStop(1, "hsla(" + hueShift + ",90%,45%,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, p.r * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  var lastPaint = 0;
  function loop(now) {
    if (!reduce) {
      if (now - lastPaint >= 16) {
        paintCanvas(now);
        lastPaint = now;
      }
      requestAnimationFrame(loop);
    }
  }

  if (canvas && !reduce) {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    requestAnimationFrame(loop);
  }

  if (reduce) {
    setBeat(0);
    scenes.forEach(function (scene, i) {
      scene.style.opacity = i === 0 ? "1" : "0";
      scene.style.visibility = i === 0 ? "visible" : "hidden";
    });
    return;
  }

  if (!window.gsap || !window.ScrollTrigger || !story || !pin) {
    setBeat(0);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0);

  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.05,
      autoRaf: false,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
  }

  var targetProgress = 0;
  var renderProgress = 0;
  var raf = 0;

  function render() {
    raf = 0;
    renderProgress += (targetProgress - renderProgress) * 0.16;
    if (Math.abs(targetProgress - renderProgress) < 0.00035) renderProgress = targetProgress;
    flowProgress = renderProgress;
    setBeat(renderProgress);
    if (renderProgress !== targetProgress) raf = requestAnimationFrame(render);
  }

  function onProgress(progress) {
    targetProgress = Math.max(0, Math.min(1, progress));
    if (!raf) raf = requestAnimationFrame(render);
  }

  // Continuous ambient motion inside active scenes (mark / phone / cards).
  gsap.to(".flow-mark", {
    y: -10,
    duration: 2.8,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
  gsap.to(".flow-phone", {
    y: -14,
    rotate: 1.4,
    duration: 3.2,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
  gsap.to(".flow-cities span", {
    y: -8,
    duration: 2.4,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
    stagger: 0.18,
  });
  gsap.to(".flow-card", {
    y: -10,
    duration: 2.6,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
    stagger: 0.2,
  });
  gsap.to(".flow-app-steps span", {
    opacity: 0.55,
    duration: 1.4,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
    stagger: 0.16,
  });

  ScrollTrigger.create({
    trigger: story,
    start: "top top",
    end: function () {
      return "+=" + Math.round(window.innerHeight * (stepCount * 1.35));
    },
    pin: pin,
    scrub: 1.05,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: function (self) {
      onProgress(self.progress);
    },
  });

  dots.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var step = Number(link.getAttribute("data-step") || 0);
      var st = ScrollTrigger.getAll().find(function (item) {
        return item.trigger === story;
      });
      if (!st) return;
      var y = st.start + ((st.end - st.start) * (step / Math.max(1, stepCount - 1)));
      if (lenis) lenis.scrollTo(y, { duration: 1.15 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    });
  });

  function ready() {
    resizeCanvas();
    ScrollTrigger.refresh();
    var st = ScrollTrigger.getAll().find(function (item) {
      return item.trigger === story;
    });
    onProgress(st ? st.progress : 0);
  }

  window.addEventListener("load", ready);
  requestAnimationFrame(ready);
})();
