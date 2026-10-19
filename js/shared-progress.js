(() => {
  const allowedStatuses = new Set(["Not Started", "In Progress", "Completed"]);
  let clientInstance = null;

  const configured = () => {
    const config = window.GROUP_H_SUPABASE_CONFIG || {};
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || "")
      && typeof config.publishableKey === "string"
      && config.publishableKey.length > 20
      && !/YOUR_|REPLACE|SERVICE_ROLE/i.test(config.publishableKey);
  };

  const getClient = () => {
    if (!configured() || !window.supabase?.createClient) return null;
    if (!clientInstance) {
      const config = window.GROUP_H_SUPABASE_CONFIG;
      clientInstance = window.supabase.createClient(config.url, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return clientInstance;
  };

  const cloneMembers = (members) => members.map((member) => ({
    ...member,
    items: (Array.isArray(member.items) ? member.items : []).map((item) => ({
      ...item,
      status: allowedStatuses.has(item.status) ? item.status : "Not Started"
    }))
  }));

  const createStore = ({ assignmentId, baselineMembers, onChange = () => {}, onAuthChange = () => {}, onNotice = () => {} }) => {
    const client = getClient();
    let members = cloneMembers(Array.isArray(baselineMembers) ? baselineMembers : []);
    let user = null;
    let profile = null;
    let channel = null;
    let authSubscription = null;
    let busyTaskId = null;

    const findTask = (taskId) => {
      for (const member of members) {
        const item = member.items.find((candidate) => candidate.id === taskId);
        if (item) return { member, item };
      }
      return null;
    };

    const emit = () => onChange({ members, user, profile, configured: Boolean(client), busyTaskId });
    const canEdit = (memberId) => Boolean(user && profile && (profile.role === "coordinator" || profile.member_id === memberId));

    const mergeRows = (rows) => {
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        if (row.assignment_id !== assignmentId) return;
        const match = findTask(row.task_id);
        if (!match || match.member.id !== row.member_id) return;
        match.item.status = row.completed ? "Completed" : "Not Started";
        if (typeof row.deliverable_url === "string" && row.deliverable_url.trim()) {
          match.item.deliverableUrl = row.deliverable_url.trim();
        }
        match.item.verificationStatus = row.verification_status || "Not submitted";
        match.item.updatedAt = row.updated_at || null;
      });
    };

    const loadProfile = async () => {
      profile = null;
      if (!client || !user) return;
      const { data, error } = await client
        .from("profiles")
        .select("member_id, display_name, role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      profile = data || null;
    };

    const loadRows = async () => {
      if (!client) return;
      const { data, error } = await client
        .from("task_progress")
        .select("assignment_id, task_id, member_id, completed, deliverable_url, verification_status, updated_at")
        .eq("assignment_id", assignmentId);
      if (error) throw error;
      mergeRows(data);
    };

    const refreshAuth = async (session) => {
      user = session?.user || null;
      try {
        await loadProfile();
      } catch (error) {
        profile = null;
        onNotice(error.message || "The member profile could not be loaded.", "error");
      }
      onAuthChange({ user, profile, configured: Boolean(client) });
      emit();
    };

    const subscribe = () => {
      if (!client || channel) return;
      channel = client
        .channel(`group-h-${assignmentId}-progress`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "task_progress",
          filter: `assignment_id=eq.${assignmentId}`
        }, (payload) => {
          mergeRows([payload.new]);
          emit();
        })
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") onNotice("Live updates are temporarily unavailable. Refresh to reload shared progress.", "error");
        });
    };

    const initialize = async () => {
      emit();
      if (!client) {
        onAuthChange({ user: null, profile: null, configured: false });
        onNotice("Shared saving is not configured yet. Tasks are read-only until the Supabase setup is completed.", "setup");
        return;
      }

      try {
        await loadRows();
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        await refreshAuth(data.session);
        subscribe();
        const authResult = client.auth.onAuthStateChange((_event, session) => {
          window.setTimeout(() => refreshAuth(session), 0);
        });
        authSubscription = authResult.data.subscription;
      } catch (error) {
        onNotice(error.message || "Shared progress could not be loaded.", "error");
        emit();
      }
    };

    const signIn = async (email, password) => {
      if (!client) throw new Error("Supabase is not configured.");
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await refreshAuth(data.session);
      if (!profile) {
        await client.auth.signOut();
        throw new Error("This account is not mapped to a Group H member. Ask the coordinator to complete the profile mapping.");
      }
      return profile;
    };

    const signOut = async () => {
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
      user = null;
      profile = null;
      onAuthChange({ user, profile, configured: true });
      emit();
    };

    const setCompleted = async (taskId, completed) => {
      const match = findTask(taskId);
      if (!match) throw new Error("The selected task could not be found.");
      if (!canEdit(match.member.id)) throw new Error("You are not authorized to update this member's tasks.");

      const previousStatus = match.item.status;
      match.item.status = completed ? "Completed" : "Not Started";
      busyTaskId = taskId;
      emit();

      const { data, error } = await client
        .from("task_progress")
        .update({ completed: Boolean(completed) })
        .eq("assignment_id", assignmentId)
        .eq("task_id", taskId)
        .eq("member_id", match.member.id)
        .select("assignment_id, task_id, member_id, completed, deliverable_url, verification_status, updated_at")
        .single();

      busyTaskId = null;
      if (error) {
        match.item.status = previousStatus;
        emit();
        throw error;
      }
      mergeRows([data]);
      emit();
    };

    const destroy = async () => {
      authSubscription?.unsubscribe();
      if (client && channel) await client.removeChannel(channel);
    };

    return {
      initialize,
      signIn,
      signOut,
      setCompleted,
      canEdit,
      destroy,
      getState: () => ({ members, user, profile, configured: Boolean(client), busyTaskId })
    };
  };

  window.GroupHProgress = Object.freeze({ createStore, isConfigured: configured });
})();
