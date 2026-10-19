(() => {
  const assignments = [
    { id: "presentation", source: "data/assignment-1-presentation.json" },
    { id: "report", source: "data/assignment-1-report.json" }
  ];

  assignments.forEach(async ({ id, source }) => {
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) throw new Error(`Progress request failed: ${response.status}`);
      const data = await response.json();
      const items = (Array.isArray(data.members) ? data.members : []).flatMap((member) => Array.isArray(member.items) ? member.items : []);
      const completed = items.filter((item) => item.status === "Completed").length;
      const percentage = items.length ? Math.round((completed / items.length) * 100) : 0;
      document.querySelectorAll(`[data-home-progress="${id}"]`).forEach((element) => element.textContent = `${percentage}% complete`);
      document.querySelectorAll(`[data-home-progress-bar="${id}"]`).forEach((bar) => {
        bar.style.width = `${percentage}%`;
        bar.closest('[role="progressbar"]')?.setAttribute("aria-valuenow", String(percentage));
      });
    } catch (error) {
      document.querySelectorAll(`[data-home-progress="${id}"]`).forEach((element) => element.textContent = "Progress unavailable");
      console.error(error);
    }
  });
})();
