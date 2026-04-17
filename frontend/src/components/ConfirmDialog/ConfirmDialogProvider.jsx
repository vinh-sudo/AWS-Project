import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const DEFAULT_ALERT = {
  open: false,
  title: "Notification",
  message: "",
  okText: "OK",
};

export const ConfirmDialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(DEFAULT_DIALOG);
  const [alertDialog, setAlertDialog] = useState(DEFAULT_ALERT);
  const alertQueueRef = useRef([]);

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

  const queueAlert = useCallback((message, options = {}) => {
    const nextAlert = {
      ...DEFAULT_ALERT,
      ...options,
      open: true,
      message: String(message ?? ""),
    };

    setAlertDialog((prev) => {
      if (!prev.open) {
        return nextAlert;
      }

      alertQueueRef.current.push(nextAlert);
      return prev;
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertDialog((prev) => {
      if (!prev.open) {
        return prev;
      }

      const nextAlert = alertQueueRef.current.shift();
      if (nextAlert) {
        return nextAlert;
      }

      return DEFAULT_ALERT;
    });
  }, []);

  useEffect(() => {
    if (!dialog.open && !alertDialog.open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (alertDialog.open) {
          closeAlert();
          return;
        }

        closeDialog(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dialog.open, alertDialog.open, closeDialog, closeAlert]);

  useEffect(() => {
    const nativeAlert = window.alert ? window.alert.bind(window) : null;

    window.alert = (message) => {
      queueAlert(message);
    };

    return () => {
      if (nativeAlert) {
        window.alert = nativeAlert;
      }
    };
  }, [queueAlert]);

  const contextValue = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      {alertDialog.open && (
        <div className="app-alert-overlay" onClick={closeAlert}>
          <div
            className="app-alert-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="app-alert-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="app-alert-header">
              <h3 id="app-alert-title">{alertDialog.title}</h3>
            </div>
            <p className="app-alert-message">{alertDialog.message}</p>
            <div className="app-alert-actions">
              <button
                type="button"
                className="app-alert-btn"
                onClick={closeAlert}
              >
                {alertDialog.okText}
              </button>
            </div>
          </div>
        </div>
      )}
      {dialog.open && (
        <div className="app-confirm-overlay" onClick={() => closeDialog(false)}>
          <div
            className="app-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
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
