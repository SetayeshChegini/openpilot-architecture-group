(() => {
  const statusElements = document.querySelectorAll("[data-task-status]");

  if (statusElements.length === 0) {
    return;
  }

  const statusClasses = new Map([
    ["Not Started", "status-not-started"],
    ["In Progress", "status-in-progress"],
    ["Completed", "status-completed"]
  ]);

  fetch("data/task-status.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Task status request failed: ${response.status}`);
      }

      return response.json();
    })
    .then((data) => {
      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      const statusesById = new Map(tasks.map((task) => [task.id, task.status]));

      statusElements.forEach((element) => {
        const status = statusesById.get(element.dataset.taskStatus);
        const statusClass = statusClasses.get(status);

        if (!statusClass) {
          return;
        }

        element.textContent = status;
        element.classList.remove(...statusClasses.values());
        element.classList.add(statusClass);
      });
    })
    .catch(() => {
      // The HTML contains safe default values if the data file is unavailable.
    });
})();
