// ============================================================================
// LeaderInternalNotes — Notes stored in localStorage (no backend API for notes)
// Schedule list loaded from backend LeaderController: GET /api/leader/schedules
// ============================================================================
import React, { useState, useEffect } from "react";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import LeaderSidebar from "../../components/LeaderSidebar/LeaderSidebar";
import authService from "../../services/authService";
import leaderService from "../../services/leaderService";
import useConfirmDialog from "../../components/ConfirmDialog/useConfirmDialog";
import "./LeaderTaskAssignment.css";

/* ===== SVG Icon helpers ===== */
const IC = {
  fileText: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  plus: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  edit: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  close: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  package: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  clock: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  lightbulb: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
    </svg>
  ),
  alertTriangle: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  inbox: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
};

const LeaderInternalNotes = () => {
  // Current leader info from auth
  const currentUser = authService.getCurrentUser();
  const currentLeaderName = currentUser?.fullName || "Leader";
  const currentTeam = "Production Line";
  const confirmAction = useConfirmDialog();

  // Internal notes for internal task assignment tracking
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("ims_leader_notes");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "NOTE-001",
            scheduleId: "SCH-001",
            scheduleInfo: "PCB-A100 - TechCorp Inc.",
            title: "Morning Shift Assignment",
            content:
              "- Worker A: Main SMT machine operator\n- Worker B: Quality inspection\n- Worker C: Component preparation",
            createdAt: "2026-01-20 08:00",
            updatedAt: "2026-01-20 08:00",
          },
          {
            id: "NOTE-002",
            scheduleId: "SCH-001",
            scheduleInfo: "PCB-A100 - TechCorp Inc.",
            title: "Technical Notes",
            content:
              "SMT-02 machine needs temperature adjustment for this PCB. Recommended temp: 245°C",
            createdAt: "2026-01-21 09:30",
            updatedAt: "2026-01-21 09:30",
          },
          {
            id: "NOTE-003",
            scheduleId: "SCH-003",
            scheduleInfo: "PCB-C300 - MicroTech Co.",
            title: "End-of-Shift Checklist",
            content:
              "1. Check completed quantity\n2. Clean machines\n3. Log production output\n4. Report incidents if any",
            createdAt: "2026-01-22 17:00",
            updatedAt: "2026-01-22 17:00",
          },
        ];
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({
    scheduleId: "",
    scheduleInfo: "",
    title: "",
    content: "",
  });

  // Load schedules from API for dropdown
  const [schedules, setSchedules] = useState([]);
  const [scheduleError, setScheduleError] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await leaderService.getMySchedules();
        setSchedules(data || []);
        setScheduleError(null);
      } catch (err) {
        console.error("Error loading schedules:", err);
        if (err.response?.status === 404) {
          setScheduleError("NOT_ASSIGNED");
        }
      }
    };
    fetchSchedules();
  }, []);

  // Save notes to localStorage
  const saveNotes = (updatedNotes) => {
    localStorage.setItem("ims_leader_notes", JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const openCreateModal = () => {
    setEditingNote(null);
    setNewNote({
      scheduleId: "",
      scheduleInfo: "",
      title: "",
      content: "",
    });
    setShowCreateModal(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setNewNote({
      scheduleId: note.scheduleId,
      scheduleInfo: note.scheduleInfo,
      title: note.title,
      content: note.content,
    });
    setShowCreateModal(true);
  };

  const handleScheduleChange = (e) => {
    const scheduleId = e.target.value;
    const schedule = schedules.find((s) => String(s.scheduleId) === scheduleId);
    setNewNote({
      ...newNote,
      scheduleId: scheduleId,
      scheduleInfo: schedule?.orderInfo || "",
    });
  };

  const handleSaveNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      alert("Please enter a title and content!");
      return;
    }

    const now = new Date().toISOString().replace("T", " ").slice(0, 16);

    if (editingNote) {
      const updatedNotes = notes.map((n) =>
        n.id === editingNote.id ? { ...n, ...newNote, updatedAt: now } : n,
      );
      saveNotes(updatedNotes);
      alert("✅ Note updated successfully!");
    } else {
      const note = {
        id: `NOTE-${Date.now()}`,
        ...newNote,
        createdAt: now,
        updatedAt: now,
      };
      saveNotes([note, ...notes]);
      alert("✅ New note created!");
    }

    setShowCreateModal(false);
    setEditingNote(null);
    setNewNote({ scheduleId: "", scheduleInfo: "", title: "", content: "" });
  };

  const handleDeleteNote = async (noteId) => {
    const accepted = await confirmAction({
      title: "Delete Note",
      message: "Are you sure you want to delete this note?",
      confirmText: "Delete",
      cancelText: "Keep",
      tone: "danger",
    });

    if (!accepted) {
      return;
    }

    const updatedNotes = notes.filter((n) => n.id !== noteId);
    saveNotes(updatedNotes);
    alert("🗑️ Note deleted!");
  };

  // ─── RENDER ─────────────────────────────────────────────────────────
  return (
    <div className="ln-layout">
      <LeaderSidebar />

      <main className="ln-content">
        {/* ── Header ────────────────────────────────── */}
        <header className="ln-header">
          <div className="ln-header-left">
            <h1 className="ln-header-title">
              {IC.fileText}
              Internal Notes
            </h1>
            <p className="ln-header-subtitle">
              Manage assignment notes and technical reminders for the production
              team
            </p>
          </div>
          <div className="ln-header-right">
            <button className="ln-btn-create" onClick={openCreateModal}>
              {IC.plus}
              Create New Note
            </button>
            <NotificationBell />
            <div className="ln-user-info">
              <span className="ln-user-name">{currentLeaderName}</span>
              <span className="ln-user-role">Leader · {currentTeam}</span>
            </div>
          </div>
        </header>

        {/* ── Not assigned warning ──────────────────── */}
        {scheduleError === "NOT_ASSIGNED" && (
          <div className="ln-info-box warning">
            <div className="ln-info-icon">{IC.alertTriangle}</div>
            <div className="ln-info-content">
              <strong>Not assigned to any production line</strong>
              <p>
                Your account has not been assigned to any production line yet.
                The production schedule list will be empty until you are
                assigned to a line by a Manager.
              </p>
            </div>
          </div>
        )}

        {/* ── Info Box ──────────────────────────────── */}
        <div className="ln-info-box">
          <div className="ln-info-icon">{IC.lightbulb}</div>
          <div className="ln-info-content">
            <strong>Internal Notes</strong>
            <p>
              Use this page to manage internal task assignment notes, technical
              reminders, and essential information for the production team.
              Detailed worker assignments are handled outside the system
              according to factory procedures.
            </p>
          </div>
        </div>

        {/* ── Summary Strip ─────────────────────────── */}
        <div className="ln-summary-strip">
          <div className="ln-summary-card accent-cyan">
            <span className="ln-summary-value">{notes.length}</span>
            <span className="ln-summary-label">Total Notes</span>
          </div>
          <div className="ln-summary-card accent-blue">
            <span className="ln-summary-value">
              {notes.filter((n) => n.scheduleId).length}
            </span>
            <span className="ln-summary-label">Linked to Schedule</span>
          </div>
          <div className="ln-summary-card accent-emerald">
            <span className="ln-summary-value">
              {new Set(notes.map((n) => n.scheduleId).filter(Boolean)).size}
            </span>
            <span className="ln-summary-label">Related Schedules</span>
          </div>
        </div>

        {/* ── Notes List ────────────────────────────── */}
        <div className="ln-notes-list">
          {notes.length === 0 ? (
            <div className="ln-empty-state">
              <div className="ln-empty-icon">{IC.inbox}</div>
              <p className="ln-empty-title">No notes yet</p>
              <p className="ln-empty-text">
                Create your first note to get started.
              </p>
              <button className="ln-empty-btn" onClick={openCreateModal}>
                Create First Note
              </button>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="ln-note-card">
                {/* Header */}
                <div className="ln-note-header">
                  <h3 className="ln-note-title">{note.title}</h3>
                  <div className="ln-note-actions">
                    <button
                      className="ln-note-action-btn"
                      onClick={() => openEditModal(note)}
                      title="Edit"
                    >
                      {IC.edit}
                    </button>
                    <button
                      className="ln-note-action-btn delete"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Delete"
                    >
                      {IC.trash}
                    </button>
                  </div>
                </div>

                {/* Schedule tag */}
                {note.scheduleInfo && (
                  <div className="ln-note-schedule">
                    {IC.package}
                    <span>{note.scheduleInfo}</span>
                  </div>
                )}

                {/* Content */}
                <div className="ln-note-content">
                  {note.content.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>

                {/* Footer */}
                <div className="ln-note-footer">
                  <span className="ln-note-time">
                    {IC.clock} Created: {note.createdAt}
                    {note.updatedAt !== note.createdAt && (
                      <> &nbsp;|&nbsp; Updated: {note.updatedAt}</>
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ══════════════════════════════════════════════
          CREATE / EDIT NOTE MODAL
         ══════════════════════════════════════════════ */}
      {showCreateModal && (
        <div
          className="ln-modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="ln-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ln-modal-header">
              <h2>
                {editingNote ? IC.edit : IC.fileText}
                {editingNote ? " Edit Note" : " Create New Note"}
              </h2>
              <button
                className="ln-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                {IC.close}
              </button>
            </div>
            <div className="ln-modal-body">
              <div className="ln-form-group">
                <label>Link to Production Schedule (optional)</label>
                <select
                  value={newNote.scheduleId}
                  onChange={handleScheduleChange}
                  className="ln-form-select"
                >
                  <option value="">-- No link --</option>
                  {schedules.map((schedule) => (
                    <option
                      key={schedule.scheduleId}
                      value={schedule.scheduleId}
                    >
                      SCH-{schedule.scheduleId} - {schedule.orderInfo || "N/A"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ln-form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                  placeholder="E.g.: Morning shift assignment, Technical notes..."
                  className="ln-form-input"
                />
              </div>

              <div className="ln-form-group">
                <label>Content *</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  placeholder="Enter note content..."
                  className="ln-form-textarea"
                  rows={8}
                />
              </div>

              <div className="ln-quick-templates">
                <label>Quick Templates:</label>
                <div className="ln-template-buttons">
                  <button
                    onClick={() =>
                      setNewNote({
                        ...newNote,
                        title: "Morning Shift Assignment",
                        content:
                          "- Worker 1: Task A\n- Worker 2: Task B\n- Worker 3: Task C",
                      })
                    }
                  >
                    👷 Shift Assignment
                  </button>
                  <button
                    onClick={() =>
                      setNewNote({
                        ...newNote,
                        title: "Technical Notes",
                        content: "Notes:\n- \n- \n- ",
                      })
                    }
                  >
                    ⚙️ Technical Notes
                  </button>
                  <button
                    onClick={() =>
                      setNewNote({
                        ...newNote,
                        title: "End-of-Shift Checklist",
                        content:
                          "1. Check quantities\n2. Clean machines\n3. Log production\n4. Shift handover",
                      })
                    }
                  >
                    ✅ Checklist
                  </button>
                </div>
              </div>
            </div>
            <div className="ln-modal-footer">
              <button
                className="ln-btn-cancel"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button className="ln-btn-confirm" onClick={handleSaveNote}>
                {editingNote ? "Update" : "Create Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderInternalNotes;
