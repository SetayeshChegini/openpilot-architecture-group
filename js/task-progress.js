(() => {
  const statusClasses = new Map([
    ["Not Started", "status-not-started"],
    ["In Progress", "status-in-progress"],
    ["Completed", "status-completed"]
  ]);

  const setStatus = (element, status) => {
    const statusClass = statusClasses.get(status);

    if (!element || !statusClass) {
      return;
    }

    element.textContent = status;
    element.classList.remove(...statusClasses.values());
    element.classList.add(statusClass);
  };

  const updateMemberProgress = (memberId, percentage) => {
    document.querySelectorAll(`[data-member-progress="${memberId}"]`).forEach((element) => {
      element.textContent = `${percentage}% complete`;
    });

    document.querySelectorAll(`[data-member-progress-bar="${memberId}"]`).forEach((bar) => {
      bar.style.width = `${percentage}%`;
      const progressbar = bar.closest('[role="progressbar"]');
      progressbar?.setAttribute("aria-valuenow", String(percentage));
    });
  };

  const deriveMemberStatus = (items, fallbackStatus) => {
    if (items.length > 0 && items.every((item) => item.status === "Completed")) {
      return "Completed";
    }

    if (items.some((item) => item.status === "In Progress" || item.status === "Completed")) {
      return "In Progress";
    }

    return statusClasses.has(fallbackStatus) ? fallbackStatus : "Not Started";
  };

  const createSubmissionLink = (rawLink) => {
    const linkText = typeof rawLink === "string" ? rawLink.trim() : "";

    if (!linkText) {
      const placeholder = document.createElement("span");
      placeholder.className = "task-no-link";
      placeholder.textContent = "Not submitted";
      return placeholder;
    }

    try {
      const url = new URL(linkText, window.location.href);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error("Unsupported link protocol");
      }

      const link = document.createElement("a");
      link.href = url.href;
      link.textContent = "Open file";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      return link;
    } catch {
      const invalid = document.createElement("span");
      invalid.className = "task-no-link";
      invalid.textContent = "Invalid link";
      return invalid;
    }
  };

  const renderTaskList = (container, member, items) => {
    container.replaceChildren();

    items.forEach((item) => {
      const row = document.createElement("article");
      row.className = "task-row";

      const description = document.createElement("div");
      description.className = "task-description";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.disabled = true;
      checkbox.checked = item.status === "Completed";
      checkbox.setAttribute("aria-label", `${item.description}: ${item.status}`);

      const copy = document.createElement("div");
      const taskText = document.createElement("strong");
      taskText.textContent = item.description;
      const owner = document.createElement("small");
      owner.textContent = `Responsible: ${member.member}`;
      copy.append(taskText, owner);
      description.append(checkbox, copy);

      const status = document.createElement("span");
      status.className = "status-badge";
      setStatus(status, statusClasses.has(item.status) ? item.status : "Not Started");

      const submission = document.createElement("div");
      submission.className = "task-submission";
      submission.append(createSubmissionLink(item.link));

      row.append(description, status, submission);
      container.append(row);
    });
  };

  const openWorkflowFromHash = () => {
    const target = document.querySelector(window.location.hash);
    if (target instanceof HTMLDetailsElement) {
      target.open = true;
    }
  };

  document.querySelectorAll("[data-open-workflow]").forEach((control) => {
    control.addEventListener("click", () => {
      const target = document.querySelector(control.getAttribute("href"));
      if (target instanceof HTMLDetailsElement) {
        target.open = true;
      }
    });
  });

  window.addEventListener("hashchange", openWorkflowFromHash);
  openWorkflowFromHash();

  fetch("data/task-status.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Task status request failed: ${response.status}`);
      }

      return response.json();
    })
    .then((data) => {
      const members = Array.isArray(data.tasks) ? data.tasks : [];
      let completedSteps = 0;
      let totalSteps = 0;

      members.forEach((member) => {
        const items = Array.isArray(member.items)
          ? member.items.filter((item) => item && typeof item.description === "string")
          : [];
        const memberCompleted = items.filter((item) => item.status === "Completed").length;
        const percentage = items.length === 0 ? 0 : Math.round((memberCompleted / items.length) * 100);
        const memberStatus = deriveMemberStatus(items, member.status);

        totalSteps += items.length;
        completedSteps += memberCompleted;
        updateMemberProgress(member.id, percentage);

        document.querySelectorAll(`[data-task-status="${member.id}"]`).forEach((element) => {
          setStatus(element, memberStatus);
        });

        const list = document.querySelector(`[data-task-list="${member.id}"]`);
        if (list) {
          renderTaskList(list, member, items);
        }
      });

      const overallPercentage = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);
      document.querySelectorAll("[data-overall-progress]").forEach((element) => {
        element.textContent = `${overallPercentage}%`;
      });
      document.querySelectorAll("[data-overall-completed]").forEach((element) => {
        element.textContent = String(completedSteps);
      });
      document.querySelectorAll("[data-overall-total]").forEach((element) => {
        element.textContent = String(totalSteps);
      });
      document.querySelectorAll("[data-overall-progress-bar]").forEach((bar) => {
        bar.style.width = `${overallPercentage}%`;
        const progressbar = bar.closest('[role="progressbar"]');
        progressbar?.setAttribute("aria-valuenow", String(overallPercentage));
      });
    })
    .catch(() => {
      document.querySelectorAll("[data-task-list]").forEach((container) => {
        container.innerHTML = '<p class="task-loading">Progress data could not be loaded. Check <code>data/task-status.json</code>.</p>';
      });
    });
})();
