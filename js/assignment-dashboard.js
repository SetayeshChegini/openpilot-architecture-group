(() => {
  const statusClasses = {
    "Not Started": "status-not-started",
    "In Progress": "status-in-progress",
    "Completed": "status-completed"
  };

  const setStatus = (element, rawStatus) => {
    if (!element) return;
    const status = statusClasses[rawStatus] ? rawStatus : "Not Started";
    element.textContent = status;
    element.classList.remove(...Object.values(statusClasses));
    element.classList.add(statusClasses[status]);
  };

  const percentageFor = (items) => {
    if (!items.length) return 0;
    const completed = items.filter((item) => item.status === "Completed").length;
    return Math.round((completed / items.length) * 100);
  };

  const derivedStatus = (items) => {
    if (items.length && items.every((item) => item.status === "Completed")) return "Completed";
    if (items.some((item) => item.status === "Completed" || item.status === "In Progress")) return "In Progress";
    return "Not Started";
  };

  const setProgress = (selector, percentage, suffix = "% complete") => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = `${percentage}${suffix}`;
    });
  };

  const setProgressBars = (selector, percentage) => {
    document.querySelectorAll(selector).forEach((bar) => {
      bar.style.width = `${percentage}%`;
      bar.closest('[role="progressbar"]')?.setAttribute("aria-valuenow", String(percentage));
    });
  };

  const safeLink = (rawLink) => {
    const value = typeof rawLink === "string" ? rawLink.trim() : "";
    if (!value) {
      const empty = document.createElement("span");
      empty.className = "task-no-link";
      empty.textContent = "Not submitted";
      return empty;
    }

    try {
      const url = new URL(value, window.location.href);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Unsupported protocol");
      const link = document.createElement("a");
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open deliverable";
      return link;
    } catch {
      const invalid = document.createElement("span");
      invalid.className = "task-no-link";
      invalid.textContent = "Invalid URL";
      return invalid;
    }
  };

  const renderTaskRows = (container, member) => {
    container.replaceChildren();
    member.items.forEach((item) => {
      const row = document.createElement("article");
      row.className = "task-row";

      const description = document.createElement("div");
      description.className = "task-description";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.disabled = true;
      checkbox.checked = item.status === "Completed";
      checkbox.setAttribute("aria-label", `${item.id}: ${item.status}`);
      const copy = document.createElement("div");
      const id = document.createElement("small");
      id.className = "task-id";
      id.textContent = item.id;
      const title = document.createElement("strong");
      title.textContent = item.description;
      const output = document.createElement("small");
      output.textContent = `Expected output: ${item.expectedOutput}`;
      copy.append(id, title, output);
      description.append(checkbox, copy);

      const status = document.createElement("span");
      status.className = "status-badge";
      setStatus(status, item.status);

      const submission = document.createElement("div");
      submission.className = "task-submission";
      submission.append(safeLink(item.deliverableUrl));
      row.append(description, status, submission);
      container.append(row);
    });
  };

  const renderStatusCollection = (container, items, itemClass) => {
    if (!container) return;
    container.replaceChildren();
    items.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = itemClass;
      const indexBadge = document.createElement("span");
      indexBadge.className = "checkpoint-number";
      indexBadge.textContent = String(index + 1);
      const label = document.createElement("strong");
      label.textContent = item.label;
      const status = document.createElement("span");
      status.className = "status-badge";
      setStatus(status, item.status);
      row.append(indexBadge, label, status);
      container.append(row);
    });
  };

  const activateTab = (memberId, updateHash = true) => {
    const tab = document.querySelector(`[role="tab"][data-member-tab="${memberId}"]`);
    const panel = document.querySelector(`[role="tabpanel"][data-member-panel="${memberId}"]`);
    if (!tab || !panel) return;

    document.querySelectorAll('[role="tab"][data-member-tab]').forEach((candidate) => {
      const selected = candidate === tab;
      candidate.setAttribute("aria-selected", String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('[role="tabpanel"][data-member-panel]').forEach((candidate) => {
      candidate.hidden = candidate !== panel;
    });

    document.querySelectorAll("[data-breadcrumb-member]").forEach((element) => {
      element.textContent = tab.dataset.memberName || tab.textContent.trim();
    });
    if (updateHash) history.replaceState(null, "", `#${memberId}`);
  };

  const setupTabs = () => {
    const tabs = [...document.querySelectorAll('[role="tab"][data-member-tab]')];
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activateTab(tab.dataset.memberTab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        tabs[next].focus();
        activateTab(tabs[next].dataset.memberTab);
      });
    });

    const requested = decodeURIComponent(window.location.hash.slice(1));
    const initial = tabs.some((tab) => tab.dataset.memberTab === requested)
      ? requested
      : tabs[0]?.dataset.memberTab;
    if (initial) activateTab(initial, Boolean(requested));
    window.addEventListener("hashchange", () => {
      const memberId = decodeURIComponent(window.location.hash.slice(1));
      if (tabs.some((tab) => tab.dataset.memberTab === memberId)) activateTab(memberId, false);
    });
  };

  const loadDashboard = async () => {
    const source = document.body.dataset.progressSource;
    if (!source) return;
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) throw new Error(`Progress request failed: ${response.status}`);
      const data = await response.json();
      const members = Array.isArray(data.members) ? data.members : [];
      const allItems = [];

      members.forEach((member) => {
        member.items = Array.isArray(member.items) ? member.items : [];
        allItems.push(...member.items);
        const percentage = percentageFor(member.items);
        setProgress(`[data-member-progress="${member.id}"]`, percentage);
        setProgressBars(`[data-member-progress-bar="${member.id}"]`, percentage);
        document.querySelectorAll(`[data-member-status="${member.id}"]`).forEach((element) => {
          setStatus(element, derivedStatus(member.items));
        });
        const taskList = document.querySelector(`[data-task-list="${member.id}"]`);
        if (taskList) renderTaskRows(taskList, member);
      });

      const overall = percentageFor(allItems);
      const completed = allItems.filter((item) => item.status === "Completed").length;
      setProgress("[data-overall-progress]", overall, "%");
      setProgressBars("[data-overall-progress-bar]", overall);
      document.querySelectorAll("[data-overall-completed]").forEach((element) => element.textContent = String(completed));
      document.querySelectorAll("[data-overall-total]").forEach((element) => element.textContent = String(allItems.length));
      renderStatusCollection(document.querySelector("[data-checkpoint-list]"), Array.isArray(data.checkpoints) ? data.checkpoints : [], "checkpoint-item");
      renderStatusCollection(document.querySelector("[data-submission-checklist]"), Array.isArray(data.submissionChecklist) ? data.submissionChecklist : [], "submission-check-item");
    } catch (error) {
      document.querySelectorAll("[data-task-list]").forEach((container) => {
        container.innerHTML = '<p class="task-loading">Progress data could not be loaded. Check the repository JSON file.</p>';
      });
      console.error(error);
    }
  };

  setupTabs();
  loadDashboard();
})();
