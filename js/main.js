(function () {
  // Mobile nav
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-active", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-active");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Curriculum shop
  var grid = document.getElementById("shop-grid");
  var items = window.CURRICULUM || [];
  if (grid) {
    items.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "shop-card";

      var series = document.createElement("p");
      series.className = "label";
      series.textContent = item.series;
      card.appendChild(series);

      var title = document.createElement("h3");
      title.textContent = item.title;
      card.appendChild(title);

      var desc = document.createElement("p");
      desc.className = "shop-desc";
      desc.textContent = item.description;
      card.appendChild(desc);

      if (item.url) {
        var link = document.createElement("a");
        link.className = "btn btn-line btn-small";
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer sponsored";
        link.textContent = "Shop on Amazon ↗";
        card.appendChild(link);
      } else {
        var soon = document.createElement("span");
        soon.className = "soon";
        soon.textContent = "Link Coming Soon";
        card.appendChild(soon);
      }

      grid.appendChild(card);
    });
  }

  // Tuition buttons preselect the lesson length in the form
  var pkgSelect = document.getElementById("ef-package");
  document.querySelectorAll("[data-package]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (pkgSelect) pkgSelect.value = btn.getAttribute("data-package");
    });
  });

  // Lesson photo carousel. Loads images/gallery/1.jpg, 2.jpg, ... in order
  // (also .jpeg, .png, .webp, any letter case) and stops at the first
  // number that has no photo. Stays hidden until at least one photo exists.
  var gallery = document.getElementById("gallery");
  if (gallery) {
    var track = document.getElementById("gallery-track");
    var counter = document.getElementById("gallery-count");
    var exts = ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG", "WEBP"];
    var maxPhotos = 40;

    var findPhoto = function (n, i, done) {
      if (i >= exts.length) return done(null);
      var src = "images/gallery/" + n + "." + exts[i];
      var img = new Image();
      img.onload = function () { done(src); };
      img.onerror = function () { findPhoto(n, i + 1, done); };
      img.src = src;
    };

    var slides = [];
    var current = 0;
    var show = function (index) {
      current = Math.max(0, Math.min(slides.length - 1, index));
      track.scrollTo({ left: slides[current].offsetLeft - track.offsetLeft, behavior: "smooth" });
    };
    var update = function () {
      var w = track.clientWidth || 1;
      current = Math.round(track.scrollLeft / w);
      counter.textContent = (current + 1) + " / " + slides.length;
      gallery.querySelector('[data-dir="-1"]').disabled = current === 0;
      gallery.querySelector('[data-dir="1"]').disabled = current >= slides.length - 1;
    };

    var addNext = function (n) {
      if (n > maxPhotos) return;
      findPhoto(n, 0, function (src) {
        if (!src) return;
        var slide = document.createElement("figure");
        slide.className = "carousel-slide";
        var img = document.createElement("img");
        img.src = src;
        img.alt = "Miss Bethany teaching a piano lesson";
        img.loading = n > 2 ? "lazy" : "eager";
        slide.appendChild(img);
        track.appendChild(slide);
        slides.push(slide);
        gallery.hidden = false;
        gallery.classList.toggle("single", slides.length === 1);
        update();
        addNext(n + 1);
      });
    };
    addNext(1);

    gallery.querySelectorAll(".carousel-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        show(current + parseInt(btn.getAttribute("data-dir"), 10));
      });
    });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(update); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); }
    });
  }

  // In-home travel fee estimate (calculated on the server; see functions/api)
  var feeForm = document.getElementById("fee-calc-form");
  if (feeForm) {
    var feeResult = document.getElementById("fee-calc-result");
    var fallback = " You can also text me at (760) 212-7749.";
    feeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var address = feeForm.address.value.trim();
      if (!address) return;
      feeResult.textContent = "Calculating\u2026";
      fetch("/api/travel-fee", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: address })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (r) {
          if (r.ok) {
            feeResult.textContent =
              "Estimated travel fee: $" + r.data.fee + "/month (" + r.data.label + ").";
          } else if (r.data && r.data.error === "not_found") {
            feeResult.textContent =
              "I couldn't find that address. Try adding the city and ZIP code." + fallback;
          } else {
            throw new Error("unavailable");
          }
        })
        .catch(function () {
          feeResult.textContent = "Sorry, the calculator isn't available right now." + fallback;
        });
    });
  }

  // Enrollment request -> mailto
  var form = document.getElementById("enroll-form");
  if (form) {
    // In-home lessons are Fridays only
    form.querySelectorAll('input[name="location"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        var inHome = form.location.value.indexOf("In-home") === 0;
        form.querySelectorAll('input[name="day"]').forEach(function (day) {
          day.disabled = inHome && day.value !== "Friday";
          if (inHome) day.checked = day.value === "Friday";
        });
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var lines = [
        "Name: " + name,
        "Email: " + form.email.value.trim(),
        "Phone: " + (form.phone.value.trim() || "—"),
        "Lesson length: " + form.package.value,
        "Location: " + form.location.value,
        "Preferred day: " + form.day.value,
        "Student age & experience: " + (form.age.value.trim() || "—"),
        "Notes: " + (form.notes.value.trim() || "—")
      ];
      window.location.href =
        "mailto:mrsbethanyalcaraz@gmail.com" +
        "?subject=" + encodeURIComponent("Piano Lesson Request — " + name) +
        "&body=" + encodeURIComponent(lines.join("\n"));
    });
  }
})();
