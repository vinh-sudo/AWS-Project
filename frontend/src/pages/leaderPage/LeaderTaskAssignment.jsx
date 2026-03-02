// ============================================================================
// LeaderInternalNotes — Notes stored in localStorage (no backend API for notes)
// Schedule list loaded from backend LeaderController: GET /api/leader/schedules
// ============================================================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import authService from "../../services/authService";
import leaderService from "../../services/leaderService";
import imsLogo from "../../assets/ims2.jpg";
import "./LeaderTaskAssignment.css";

const LeaderInternalNotes = () => {
  const navigate = useNavigate();

  // Current leader info from auth
  const currentUser = authService.getCurrentUser();
  const currentLeaderName = currentUser?.fullName || "Leader";
  const currentTeam = "Production Line";

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
            title: "Phân công ca sáng",
            content:
              "- Nguyễn Văn A: Vận hành máy SMT chính\n- Trần Thị B: Kiểm tra chất lượng\n- Lê Văn C: Chuẩn bị linh kiện",
            createdAt: "2026-01-20 08:00",
            updatedAt: "2026-01-20 08:00",
          },
          {
            id: "NOTE-002",
            scheduleId: "SCH-001",
            scheduleInfo: "PCB-A100 - TechCorp Inc.",
            title: "Lưu ý kỹ thuật",
            content:
              "Máy SMT-02 cần điều chỉnh nhiệt độ khi chạy PCB này. Nhiệt độ đề xuất: 245°C",
            createdAt: "2026-01-21 09:30",
            updatedAt: "2026-01-21 09:30",
          },
          {
            id: "NOTE-003",
            scheduleId: "SCH-003",
            scheduleInfo: "PCB-C300 - MicroTech Co.",
            title: "Checklist cuối ca",
            content:
              "1. Kiểm tra số lượng hoàn thành\n2. Vệ sinh máy\n3. Ghi log sản lượng\n4. Báo cáo sự cố nếu có",
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

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await leaderService.getMySchedules();
        setSchedules(data || []);
      } catch (err) {
        console.error("Error loading schedules:", err);
      }
    };
    fetchSchedules();
  }, []);

  // Save notes to localStorage
  const saveNotes = (updatedNotes) => {
    localStorage.setItem("ims_leader_notes", JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
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
      alert("Vui lòng nhập tiêu đề và nội dung!");
      return;
    }

    const now = new Date().toISOString().replace("T", " ").slice(0, 16);

    if (editingNote) {
      // Update existing note
      const updatedNotes = notes.map((n) =>
        n.id === editingNote.id
          ? {
              ...n,
              ...newNote,
              updatedAt: now,
            }
          : n,
      );
      saveNotes(updatedNotes);
      alert("✅ Đã cập nhật ghi chú!");
    } else {
      // Create new note
      const note = {
        id: `NOTE-${Date.now()}`,
        ...newNote,
        createdAt: now,
        updatedAt: now,
      };
      saveNotes([note, ...notes]);
      alert("✅ Đã tạo ghi chú mới!");
    }

    setShowCreateModal(false);
    setEditingNote(null);
    setNewNote({
      scheduleId: "",
      scheduleInfo: "",
      title: "",
      content: "",
    });
  };

  const handleDeleteNote = (noteId) => {
    if (window.confirm("Bạn có chắc muốn xóa ghi chú này?")) {
      const updatedNotes = notes.filter((n) => n.id !== noteId);
      saveNotes(updatedNotes);
      alert("🗑️ Đã xóa ghi chú!");
    }
  };

  return (
    <div className="leader-assignment-container">
      {/* Sidebar */}
      <aside className="leader-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS Leader</span>
        </div>

        <nav className="sidebar-nav">
          <div
            className="nav-item"
            onClick={() => navigate("/leader/progress")}
          >
            <span className="nav-icon">📊</span>
            <span>Progress Update</span>
          </div>
          <div className="nav-item active">
            <span className="nav-icon">📋</span>
            <span>Internal Notes</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="leader-main">
        {/* Header */}
        <header className="leader-header">
          <div className="header-left">
            <h1>📋 Ghi chú nội bộ</h1>
            <p>Quản lý ghi chú phân công và lưu ý kỹ thuật cho đội sản xuất</p>
          </div>
          <div className="header-right">
            <button className="btn-create" onClick={openCreateModal}>
              + Tạo ghi chú mới
            </button>
            <NotificationBell />
            <div className="user-info">
              <span className="user-name">{currentLeaderName}</span>
              <span className="user-role">Leader - {currentTeam}</span>
            </div>
          </div>
        </header>

        {/* Info Box */}
        <div className="info-box">
          <span className="info-icon">💡</span>
          <div className="info-content">
            <strong>Ghi chú nội bộ</strong>
            <p>
              Sử dụng trang này để ghi chú phân công công việc nội bộ, lưu ý kỹ
              thuật, và các thông tin cần thiết cho đội sản xuất. Việc phân công
              chi tiết công nhân được thực hiện ngoài hệ thống theo quy trình
              nhà máy.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-number">{notes.length}</span>
            <span className="stat-label">Tổng ghi chú</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {notes.filter((n) => n.scheduleId).length}
            </span>
            <span className="stat-label">Gắn với lịch sản xuất</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {new Set(notes.map((n) => n.scheduleId).filter(Boolean)).size}
            </span>
            <span className="stat-label">Lịch sản xuất liên quan</span>
          </div>
        </div>

        {/* Notes List */}
        <div className="notes-list">
          {notes.length === 0 ? (
            <div className="empty-state">
              <span>📝</span>
              <p>Chưa có ghi chú nào</p>
              <button className="btn-create-empty" onClick={openCreateModal}>
                Tạo ghi chú đầu tiên
              </button>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="note-card">
                <div className="note-header">
                  <h3 className="note-title">{note.title}</h3>
                  <div className="note-actions">
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(note)}
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {note.scheduleInfo && (
                  <div className="note-schedule">
                    <span className="schedule-icon">📦</span>
                    <span>{note.scheduleInfo}</span>
                  </div>
                )}

                <div className="note-content">
                  {note.content.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>

                <div className="note-footer">
                  <span className="note-time">
                    📅 Tạo: {note.createdAt}
                    {note.updatedAt !== note.createdAt && (
                      <> | Cập nhật: {note.updatedAt}</>
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Create/Edit Note Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingNote ? "✏️ Chỉnh sửa ghi chú" : "📝 Tạo ghi chú mới"}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Liên kết với lịch sản xuất (tùy chọn)</label>
                <select
                  value={newNote.scheduleId}
                  onChange={handleScheduleChange}
                  className="form-select"
                >
                  <option value="">-- Không liên kết --</option>
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

              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                  placeholder="Ví dụ: Phân công ca sáng, Lưu ý kỹ thuật..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Nội dung *</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  placeholder="Nhập nội dung ghi chú..."
                  className="form-textarea"
                  rows={8}
                />
              </div>

              <div className="quick-templates">
                <label>Mẫu nhanh:</label>
                <div className="template-buttons">
                  <button
                    onClick={() =>
                      setNewNote({
                        ...newNote,
                        title: "Phân công ca sáng",
                        content:
                          "- Người 1: Nhiệm vụ A\n- Người 2: Nhiệm vụ B\n- Người 3: Nhiệm vụ C",
                      })
                    }
                  >
                    👷 Phân công ca
                  </button>
                  <button
                    onClick={() =>
                      setNewNote({
                        ...newNote,
                        title: "Lưu ý kỹ thuật",
                        content: "Lưu ý:\n- \n- \n- ",
                      })
                    }
                  >
                    ⚙️ Lưu ý kỹ thuật
                  </button>
                  <button
                    onClick={() =>
                      setNewNote({
                        ...newNote,
                        title: "Checklist cuối ca",
                        content:
                          "1. Kiểm tra số lượng\n2. Vệ sinh máy\n3. Ghi log\n4. Bàn giao ca",
                      })
                    }
                  >
                    ✅ Checklist
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </button>
              <button className="btn-save" onClick={handleSaveNote}>
                {editingNote ? "Cập nhật" : "Tạo ghi chú"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderInternalNotes;
