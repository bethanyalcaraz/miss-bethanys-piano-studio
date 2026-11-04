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
