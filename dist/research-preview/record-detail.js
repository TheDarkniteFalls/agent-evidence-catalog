(() => {
  "use strict";

  const requestedState = new URLSearchParams(window.location.search);
  const catalogState = new URLSearchParams();
  const search = requestedState.get("q");
  const delivery = requestedState.get("delivery");

  if (search) catalogState.set("q", search);
  if (["local", "hybrid", "hosted"].includes(delivery)) catalogState.set("delivery", delivery);

  const query = catalogState.toString();
  if (!query) return;
  const suffix = `?${query}`;

  document.querySelectorAll("[data-catalog-return]").forEach((link) => {
    link.href = `../index.html${suffix}`;
  });

  document.querySelectorAll("[data-record-detail-link]").forEach((link) => {
    link.href = `${link.getAttribute("href")}${suffix}`;
  });
})();
