import React, { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmDialogContext from "./ConfirmDialogContext";
import "./ConfirmDialog.css";

const DEFAULT_DIALOG = {
  open: false,
  title: "Confirm Action",
  message: "Are you sure you want to continue?",
  confirmText: "Confirm",
  cancelText: "Cancel",
  tone: "default",
};

export const ConfirmDialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(DEFAULT_DIALOG);

  const closeDialog = useCallback((value) => {
    setDialog((prev) => {
      if (typeof prev.resolve === "function") {
        prev.resolve(value);
      }
      return DEFAULT_DIALOG;
    });
  }, []);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        ...DEFAULT_DIALOG,
        ...options,
        open: true,
        resolve,
      });
    });
  }, []);

  useEffect(() => {
    if (!dialog.open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDialog(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dialog.open, closeDialog]);

  const contextValue = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      {dialog.open && (
        <div className="app-confirm-overlay" onClick={() => closeDialog(false)}>
          <div className="app-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="app-confirm-header">
              <h3>{dialog.title}</h3>
            </div>
            <p className="app-confirm-message">{dialog.message}</p>
            <div className="app-confirm-actions">
              <button
                type="button"
                className="app-confirm-btn app-confirm-cancel"
                onClick={() => closeDialog(false)}
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                className={`app-confirm-btn app-confirm-ok ${dialog.tone === "danger" ? "danger" : ""}`}
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
};
