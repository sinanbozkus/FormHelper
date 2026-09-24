import { setText } from "./utils.js";

// Toast notifications (window.fhToastr): a dependency-free toastr with css transitions.
// Messages are shown as text by default.

const defaults = {
  containerId: "formhelper-toast-container",
  target: "body",
  toastClass: "formhelper-toast",
  titleClass: "formhelper-toast-title",
  messageClass: "formhelper-toast-message",
  closeClass: "formhelper-toast-close-button",
  progressClass: "formhelper-toast-progress",
  positionClass: "formhelper-toast-top-right",
  iconClasses: {
    error: "formhelper-toast-error",
    info: "formhelper-toast-info",
    success: "formhelper-toast-success",
    warning: "formhelper-toast-warning"
  },
  timeOut: 5000, // set timeOut and extendedTimeOut to 0 to make it sticky
  extendedTimeOut: 1000,
  showDuration: 300,
  hideDuration: 1000,
  closeButton: false,
  closeHtml: "<button type=\"button\">&times;</button>",
  progressBar: false,
  preventDuplicates: false,
  newestOnTop: true,
  tapToDismiss: true,
  closeOnHover: true,
  // true: message and title are shown as text. Set false to show html you trust (never user input).
  escapeHtml: true,
  rtl: false,
  onclick: null,
  onShown: null,
  onHidden: null,
  onCloseClick: null
};

const HIDDEN_CLASS = "formhelper-toast-hidden";

let previousMessage;

export const toastr = {
  version: __VERSION__,
  options: {},
  success: (message, title, options) => notify("success", message, title, options),
  info: (message, title, options) => notify("info", message, title, options),
  warning: (message, title, options) => notify("warning", message, title, options),
  error: (message, title, options) => notify("error", message, title, options),
  clear,
  remove
};

function getOptions(override) {
  const options = Object.assign({}, defaults, toastr.options, override);
  options.iconClasses = Object.assign({}, defaults.iconClasses, toastr.options.iconClasses, override && override.iconClasses);
  return options;
}

function getContainer(options, create) {
  let container = document.getElementById(options.containerId);

  if (!container && create) {
    container = document.createElement("div");
    container.id = options.containerId;
    (document.querySelector(options.target) || document.body).appendChild(container);
  }

  return container;
}

function setContent(element, value, escape) {
  if (escape) {
    setText(element, String(value));
  } else {
    element.innerHTML = value;
  }
}

function notify(type, message, title, override) {
  const options = getOptions(override);

  if (options.preventDuplicates) {
    if (message === previousMessage) {
      return null;
    }
    previousMessage = message;
  }

  const container = getContainer(options, true);
  container.className = options.positionClass;

  const toast = document.createElement("div");
  toast.className = options.toastClass + " " + options.iconClasses[type];
  toast.setAttribute("role", type === "error" || type === "warning" ? "alert" : "status");
  toast.setAttribute("aria-live", type === "error" || type === "warning" ? "assertive" : "polite");

  if (options.rtl) {
    toast.classList.add("rtl");
  }

  let progress = null;
  if (options.progressBar) {
    progress = document.createElement("div");
    progress.className = options.progressClass;
    toast.appendChild(progress);
  }

  if (options.closeButton) {
    const template = document.createElement("template");
    template.innerHTML = options.closeHtml.trim();
    const close = template.content.firstElementChild;
    close.classList.add(options.closeClass);
    close.setAttribute("role", "button");
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      if (options.onCloseClick) {
        options.onCloseClick(event);
      }
      hide(true);
    });
    toast.insertBefore(close, toast.firstChild);
  }

  if (title) {
    const titleElement = document.createElement("div");
    titleElement.className = options.titleClass;
    setContent(titleElement, title, options.escapeHtml);
    toast.appendChild(titleElement);
  }

  if (message) {
    const messageElement = document.createElement("div");
    messageElement.className = options.messageClass;
    setContent(messageElement, message, options.escapeHtml);
    toast.appendChild(messageElement);
  }

  if (options.newestOnTop) {
    container.insertBefore(toast, container.firstChild);
  } else {
    container.appendChild(toast);
  }

  // show with a fade-in transition
  toast.classList.add(HIDDEN_CLASS);
  toast.style.transitionDuration = options.showDuration + "ms";
  void toast.offsetWidth;
  toast.classList.remove(HIDDEN_CLASS);

  if (options.onShown) {
    setTimeout(options.onShown, options.showDuration);
  }

  let hideTimer = null;
  let progressTimer = null;
  let hideEta = 0;
  let maxHideTime = 0;
  let hidden = false;

  function startTimer(duration) {
    if (duration > 0) {
      hideTimer = setTimeout(() => hide(false), duration);
      maxHideTime = duration;
      hideEta = Date.now() + duration;

      if (progress && !progressTimer) {
        progressTimer = setInterval(() => {
          const percentage = Math.max(0, ((hideEta - Date.now()) / maxHideTime) * 100);
          progress.style.width = percentage + "%";
        }, 10);
      }
    }
  }

  function hide(override) {
    if (hidden || (!override && toast.contains(document.activeElement))) {
      return;
    }

    hidden = true;
    clearTimeout(hideTimer);
    clearInterval(progressTimer);

    toast.style.transitionDuration = options.hideDuration + "ms";
    toast.classList.add(HIDDEN_CLASS);

    setTimeout(() => {
      removeToast(toast);
      if (options.onHidden) {
        options.onHidden();
      }
    }, options.hideDuration);
  }

  if (options.closeOnHover) {
    toast.addEventListener("mouseenter", () => {
      if (hidden) {
        return;
      }
      clearTimeout(hideTimer);
      hideEta = 0;
    });

    toast.addEventListener("mouseleave", () => {
      if (!hidden && (options.timeOut > 0 || options.extendedTimeOut > 0)) {
        startTimer(options.extendedTimeOut);
      }
    });
  }

  if (options.onclick) {
    toast.addEventListener("click", (event) => {
      options.onclick(event);
      hide(false);
    });
  } else if (options.tapToDismiss) {
    toast.addEventListener("click", () => hide(false));
  }

  startTimer(options.timeOut);

  toast.formhelperHide = hide;
  return toast;
}

function removeToast(toast) {
  const container = toast.parentNode;

  if (container) {
    container.removeChild(toast);

    if (container.children.length === 0 && container.parentNode) {
      container.parentNode.removeChild(container);
      previousMessage = undefined;
    }
  }
}

// Hides the given toast (or all of them) with the hide transition.
function clear(toast) {
  const toasts = toast ? [toast.jquery ? toast[0] : toast] : currentToasts();
  toasts.forEach((t) => (t && t.formhelperHide ? t.formhelperHide(true) : t && removeToast(t)));
}

// Removes the given toast (or all of them) immediately.
function remove(toast) {
  const toasts = toast ? [toast.jquery ? toast[0] : toast] : currentToasts();
  toasts.forEach((t) => t && removeToast(t));
}

function currentToasts() {
  const container = getContainer(getOptions(), false);
  return container ? Array.from(container.children) : [];
}
