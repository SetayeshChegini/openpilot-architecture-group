(() => {
  const assignments = [
    { id: "presentation", source: "data/assignment-1-presentation.json" },
    { id: "report", source: "data/assignment-1-report.json?v=20261026-1", finalized: true }
  ];

  const render = (id, state, finalized = false) => {
    const items = state.members.flatMap((member) => member.items || []);
    const completed = finalized ? items.length : items.filter((item) => item.status === "Completed").length;
    const percentage = items.length ? Math.round((completed / items.length) * 100) : 0;
    document.querySelectorAll(`[data-home-progress="${id}"]`).forEach((element) => {
      element.textContent = percentage === 100
        ? "Completed – All Tasks Finished"
        : `${completed} of ${items.length} · ${percentage}% complete`;
      element.classList.toggle("is-complete", percentage === 100);
    });
    document.querySelectorAll(`[data-home-progress-bar="${id}"]`).forEach((bar) => {
      bar.style.width = `${percentage}%`;
      const progressbar = bar.closest('[role="progressbar"]');
      progressbar?.setAttribute("aria-valuenow", String(percentage));
      progressbar?.classList.toggle("is-complete", percentage === 100);
    });
    document.querySelectorAll(`[data-home-sync="${id}"]`).forEach((element) => {
      element.textContent = finalized ? "Completed" : state.configured ? "Live shared progress" : "Shared saving setup pending";
      element.classList.toggle("is-live", finalized || state.configured);
    });
  };

  assignments.forEach(async ({ id, source, finalized = false }) => {
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) throw new Error(`Task catalog request failed: ${response.status}`);
      const data = await response.json();
      if (finalized) {
        render(id, { members: data.members, configured: false }, true);
        return;
      }
      const store = window.GroupHProgress.createStore({
        assignmentId: id,
        baselineMembers: data.members,
        onChange: (state) => render(id, state, false)
      });
      await store.initialize();
    } catch (error) {
      document.querySelectorAll(`[data-home-progress="${id}"]`).forEach((element) => element.textContent = "Progress unavailable");
      console.error(error);
    }
  });
})();
