(() => {
  const statusClasses = {
    "Not Started": "status-not-started",
    "In Progress": "status-in-progress",
    "Completed": "status-completed"
  };

  let progressStore = null;

  const summaryFor = (items) => {
    const total = items.length;
    const completed = items.filter((item) => item.status === "Completed").length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;
    const status = total > 0 && completed === total
      ? "Completed"
      : completed > 0 || items.some((item) => item.status === "In Progress")
        ? "In Progress"
        : "Not Started";
    return { total, completed, percentage, status };
  };

  const setStatus = (element, status, completeLabel = false) => {
    if (!element) return;
    const validStatus = statusClasses[status] ? status : "Not Started";
    element.textContent = completeLabel && validStatus === "Completed"
      ? "Completed – All Tasks Finished"
      : validStatus;
    element.classList.remove(...Object.values(statusClasses));
    element.classList.add(statusClasses[validStatus]);
  };

  const setProgressBar = (bar, percentage) => {
    if (!bar) return;
    bar.style.width = `${percentage}%`;
    const progressbar = bar.closest('[role="progressbar"]');
    progressbar?.setAttribute("aria-valuenow", String(percentage));
    progressbar?.classList.toggle("is-complete", percentage === 100);
  };

  const safeLink = (rawLink) => {
    const value = typeof rawLink === "string" ? rawLink.trim() : "";
    if (!value) {
      const empty = document.createElement("span");
      empty.className = "task-no-link";
      empty.textContent = "No file linked";
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
      invalid.textContent = "Invalid deliverable URL";
      return invalid;
    }
  };

  const requestToggle = async (item, completed) => {
    if (!progressStore) return;
    const message = document.querySelector("[data-auth-message]");
    try {
      if (message) message.textContent = "Saving shared progress…";
      await progressStore.setCompleted(item.id, completed);
      if (message) message.textContent = completed ? "Task marked completed and saved for the team." : "Task reopened and shared progress updated.";
    } catch (error) {
      if (message) message.textContent = `Could not save: ${error.message}`;
    }
  };

  const renderTaskList = (container, member, state) => {
    container.replaceChildren();
    member.items.forEach((item) => {
      const completed = item.status === "Completed";
      const editable = state.configured && progressStore?.canEdit(member.id) && !state.busyTaskId;
      const pending = state.busyTaskId === item.id;
      const row = document.createElement("article");
      row.className = "task-row interactive-task-row";
      row.classList.toggle("is-completed", completed);
      row.classList.toggle("is-editable", editable);
      row.classList.toggle("is-pending", pending);
      row.setAttribute("aria-busy", String(pending));

      const description = document.createElement("div");
      description.className = "task-description";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = completed;
      checkbox.disabled = !editable || pending;
      checkbox.className = "task-completion-checkbox";
      checkbox.setAttribute("aria-label", `${completed ? "Reopen" : "Complete"} ${item.id}: ${item.description}`);
      checkbox.title = editable
        ? completed ? "Uncheck to reopen this task" : "Check to mark this task completed"
        : state.configured ? "Sign in as this member, or as the coordinator, to update this task" : "Shared saving must be configured before tasks can be changed";
      checkbox.addEventListener("click", (event) => event.stopPropagation());
      checkbox.addEventListener("change", () => requestToggle(item, checkbox.checked));

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
      setStatus(status, completed ? "Completed" : "Not Started");

      const submission = document.createElement("div");
      submission.className = "task-submission";
      submission.append(safeLink(item.deliverableUrl));
      const verification = document.createElement("small");
      verification.className = "verification-state";
      verification.textContent = `Verification: ${item.verificationStatus || "Not submitted"}`;
      submission.append(verification);

      if (editable) {
        row.tabIndex = 0;
        row.setAttribute("role", "checkbox");
        row.setAttribute("aria-checked", String(completed));
        const toggle = () => requestToggle(item, !completed);
        row.addEventListener("click", (event) => {
          if (!event.target.closest("a, input, button")) toggle();
        });
        row.addEventListener("keydown", (event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            toggle();
          }
        });
      }

      row.append(description, status, submission);
      container.append(row);
    });
  };

  const renderStatusCollection = (container, items, itemClass) => {
    if (!container || container.childElementCount > 1) return;
    container.replaceChildren();
    items.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = itemClass;
      const number = document.createElement("span");
      number.className = "checkpoint-number";
      number.textContent = String(index + 1);
      const label = document.createElement("strong");
      label.textContent = item.label;
      const status = document.createElement("span");
      status.className = "status-badge";
      setStatus(status, item.status);
      row.append(number, label, status);
      container.append(row);
    });
  };

  const renderDashboard = (state) => {
    const allItems = [];
    state.members.forEach((member) => {
      const summary = summaryFor(member.items);
      allItems.push(...member.items);
      document.querySelectorAll(`[data-member-progress="${member.id}"]`).forEach((element) => {
        element.textContent = `${summary.completed} of ${summary.total} · ${summary.percentage}% complete`;
      });
      document.querySelectorAll(`[data-member-progress-bar="${member.id}"]`).forEach((bar) => setProgressBar(bar, summary.percentage));
      document.querySelectorAll(`[data-member-status="${member.id}"]`).forEach((element) => setStatus(element, summary.status, true));
      const list = document.querySelector(`[data-task-list="${member.id}"]`);
      if (list) renderTaskList(list, member, state);
    });

    const overall = summaryFor(allItems);
    document.querySelectorAll("[data-overall-progress]").forEach((element) => element.textContent = `${overall.percentage}%`);
    document.querySelectorAll("[data-overall-completed]").forEach((element) => element.textContent = String(overall.completed));
    document.querySelectorAll("[data-overall-total]").forEach((element) => element.textContent = String(overall.total));
    document.querySelectorAll("[data-overall-progress-bar]").forEach((bar) => setProgressBar(bar, overall.percentage));
    document.querySelectorAll("[data-overall-state]").forEach((element) => {
      element.textContent = overall.percentage === 100 ? "Completed – All Tasks Finished" : overall.status;
      element.classList.toggle("is-complete", overall.percentage === 100);
    });
  };

  const setAuthView = ({ configured, user, profile }) => {
    const panel = document.querySelector("[data-auth-panel]");
    if (!panel) return;
    const banner = panel.querySelector("[data-persistence-banner]");
    const form = panel.querySelector("[data-auth-form]");
    const session = panel.querySelector("[data-auth-session]");
    const title = panel.querySelector("[data-persistence-title]");
    const description = panel.querySelector("[data-persistence-description]");
    const userLabel = panel.querySelector("[data-auth-user]");

    panel.classList.toggle("is-unconfigured", !configured);
    panel.classList.toggle("is-authenticated", Boolean(user && profile));
    banner?.classList.toggle("setup-required", !configured);

    if (!configured) {
      if (title) title.textContent = "Shared saving requires Supabase setup";
      if (description) description.textContent = "The secure integration is installed, but no Supabase project URL or public key is configured. Tasks remain read-only.";
      if (form) form.hidden = true;
      if (session) session.hidden = true;
      return;
    }

    if (user && profile) {
      if (title) title.textContent = "Shared progress is connected";
      if (description) description.textContent = profile.role === "coordinator"
        ? "Coordinator access: you can update every member's tasks."
        : `Member access: you can update only ${profile.display_name}'s tasks.`;
      if (form) form.hidden = true;
      if (session) session.hidden = false;
      if (userLabel) userLabel.textContent = `${profile.display_name} · ${profile.role}`;
    } else {
      if (title) title.textContent = "Shared progress is connected · Sign in to update tasks";
      if (description) description.textContent = "Progress is visible to everyone. Only invited Group H accounts can change assigned checkboxes.";
      if (form) form.hidden = false;
      if (session) session.hidden = true;
    }
  };

  const setupAuthControls = () => {
    const form = document.querySelector("[data-auth-form]");
    const signOut = document.querySelector("[data-sign-out]");
    const message = document.querySelector("[data-auth-message]");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      submit.disabled = true;
      if (message) message.textContent = "Signing in…";
      try {
        const profile = await progressStore.signIn(email, password);
        form.reset();
        if (message) message.textContent = `Signed in as ${profile.display_name}.`;
      } catch (error) {
        if (message) message.textContent = `Sign-in failed: ${error.message}`;
      } finally {
        submit.disabled = false;
      }
    });
    signOut?.addEventListener("click", async () => {
      signOut.disabled = true;
      try {
        await progressStore.signOut();
        if (message) message.textContent = "Signed out. Task checkboxes are read-only.";
      } catch (error) {
        if (message) message.textContent = `Sign-out failed: ${error.message}`;
      } finally {
        signOut.disabled = false;
      }
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
    document.querySelectorAll('[role="tabpanel"][data-member-panel]').forEach((candidate) => candidate.hidden = candidate !== panel);
    document.querySelectorAll("[data-breadcrumb-member]").forEach((element) => element.textContent = tab.dataset.memberName || tab.textContent.trim());
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
    const initial = tabs.some((tab) => tab.dataset.memberTab === requested) ? requested : tabs[0]?.dataset.memberTab;
    if (initial) activateTab(initial, Boolean(requested));
    window.addEventListener("hashchange", () => {
      const memberId = decodeURIComponent(window.location.hash.slice(1));
      if (tabs.some((tab) => tab.dataset.memberTab === memberId)) activateTab(memberId, false);
    });
  };

  const loadDashboard = async () => {
    const source = document.body.dataset.progressSource;
    const assignmentId = document.body.dataset.assignmentId;
    if (!source || !assignmentId) return;
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) throw new Error(`Task catalog request failed: ${response.status}`);
      const data = await response.json();
      const packageUrl = typeof data.packageUrl === "string" ? data.packageUrl.trim() : "";
      if (packageUrl) {
        data.members?.forEach((member) => member.items?.forEach((item) => {
          if (item.status !== "Completed") return;
          if (!item.deliverableUrl) item.deliverableUrl = packageUrl;
          if (!item.verificationStatus) item.verificationStatus = "Verified in final package";
        }));
      }
      renderStatusCollection(document.querySelector("[data-checkpoint-list]"), Array.isArray(data.checkpoints) ? data.checkpoints : [], "checkpoint-item");
      renderStatusCollection(document.querySelector("[data-submission-checklist]"), Array.isArray(data.submissionChecklist) ? data.submissionChecklist : [], "submission-check-item");

      if (!window.GroupHProgress?.createStore) throw new Error("The shared progress client did not load.");
      progressStore = window.GroupHProgress.createStore({
        assignmentId,
        baselineMembers: data.members,
        onChange: renderDashboard,
        onAuthChange: setAuthView,
        onNotice: (text, type) => {
          const message = document.querySelector("[data-auth-message]");
          if (message) message.textContent = text;
          document.querySelector("[data-auth-panel]")?.classList.toggle("has-error", type === "error");
        }
      });
      setupAuthControls();
      await progressStore.initialize();
    } catch (error) {
      document.querySelectorAll("[data-task-list]").forEach((container) => {
        container.innerHTML = '<p class="task-loading">Task progress could not be loaded. Refresh the page or check the site configuration.</p>';
      });
      const message = document.querySelector("[data-auth-message]");
      if (message) message.textContent = error.message;
      console.error(error);
    }
  };

  setupTabs();
  loadDashboard();
})();
