(function () {
  "use strict";

  // --- Add Bundle to Cart ---
  function initBundleButtons() {
    document.querySelectorAll(".bundlebox-add-bundle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var productIds = btn.dataset.bundleProducts.split(",").map(function (id) { return id.trim(); });
        btn.disabled = true;
        btn.textContent = "Adding...";

        var items = productIds.map(function (id) { return { id: parseInt(id), quantity: 1 }; });

        fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: items }),
        })
          .then(function (res) { return res.json(); })
          .then(function () {
            btn.textContent = "Bundle Added!";
            setTimeout(function () {
              btn.textContent = "Add Bundle to Cart";
              btn.disabled = false;
            }, 2000);
          })
          .catch(function () {
            btn.textContent = "Error — Try Again";
            btn.disabled = false;
          });
      });
    });
  }

  // --- Mix & Match Selection ---
  function initMixMatch() {
    var container = document.querySelector(".bundlebox-mixmatch");
    if (!container) return;

    var minItems = parseInt(container.dataset.minItems) || 3;
    var discount = parseInt(container.dataset.discount) || 20;
    var countEl = container.querySelector(".bundlebox-mixmatch__count");
    var savingsEl = container.querySelector(".bundlebox-mixmatch__savings");
    var savingsAmountEl = container.querySelector(".bundlebox-mixmatch__savings-amount");
    var submitBtn = container.querySelector(".bundlebox-mixmatch__submit");
    var checkboxes = container.querySelectorAll(".bundlebox-mixmatch__check");

    function updateState() {
      var selected = container.querySelectorAll(".bundlebox-mixmatch__check:checked");
      var count = selected.length;
      countEl.textContent = count;
      submitBtn.disabled = count < minItems;

      var totalPrice = 0;
      selected.forEach(function (cb) {
        var item = cb.closest(".bundlebox-mixmatch__item");
        totalPrice += parseInt(item.dataset.price) || 0;
      });

      if (count >= minItems) {
        var saving = (totalPrice * discount) / 100;
        savingsAmountEl.textContent = (saving / 100).toFixed(2);
        savingsEl.style.display = "block";
      } else {
        savingsEl.style.display = "none";
      }
    }

    checkboxes.forEach(function (cb) { cb.addEventListener("change", updateState); });

    submitBtn.addEventListener("click", function () {
      var selected = container.querySelectorAll(".bundlebox-mixmatch__check:checked");
      var items = [];
      selected.forEach(function (cb) {
        var item = cb.closest(".bundlebox-mixmatch__item");
        items.push({ id: parseInt(item.dataset.variantId), quantity: 1 });
      });

      submitBtn.disabled = true;
      submitBtn.textContent = "Adding...";

      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items }),
      })
        .then(function () {
          submitBtn.textContent = "Added to Cart!";
          setTimeout(function () {
            submitBtn.textContent = "Add Selected to Cart";
            updateState();
          }, 2000);
        })
        .catch(function () {
          submitBtn.textContent = "Error — Try Again";
          submitBtn.disabled = false;
        });
    });
  }

  // --- Volume Pricing Table Highlight ---
  function initVolumeTable() {
    var table = document.querySelector(".bundlebox-volume");
    if (!table) return;

    var qtyInput = document.querySelector('input[name="quantity"], [data-quantity-input]');
    if (!qtyInput) return;

    function updateHighlight() {
      var qty = parseInt(qtyInput.value) || 1;
      var rows = table.querySelectorAll(".bundlebox-volume__row");
      rows.forEach(function (row) {
        var tierQty = parseInt(row.dataset.tierQty);
        row.classList.toggle("active", qty >= tierQty);
      });
    }

    qtyInput.addEventListener("change", updateHighlight);
    qtyInput.addEventListener("input", updateHighlight);
    updateHighlight();
  }

  // --- Init ---
  function init() {
    initBundleButtons();
    initMixMatch();
    initVolumeTable();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
