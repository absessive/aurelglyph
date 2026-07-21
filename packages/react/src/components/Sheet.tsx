import {
  useEffect,
  useId,
  useRef,
  type DialogHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent
} from "react";

export type SheetDismissReason = "backdrop" | "escape" | "native-close";

export type SheetOpenChangeDetails = {
  reason: SheetDismissReason;
};

export type SheetProps = Omit<DialogHTMLAttributes<HTMLDialogElement>, "open" | "title"> & {
  actions?: ReactNode;
  children: ReactNode;
  onOpenChange?: (open: boolean, details: SheetOpenChangeDetails) => void;
  open?: boolean;
  title: ReactNode;
};

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function focusSheet(dialog: HTMLDialogElement): void {
  if (dialog.contains(document.activeElement)) return;

  const autofocusTarget = dialog.querySelector<HTMLElement>("[autofocus]");
  const firstFocusable = dialog.querySelector<HTMLElement>(focusableSelector);
  (autofocusTarget ?? firstFocusable ?? dialog).focus();
}

function focusableElements(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true"
  );
}

function isBackdropClick(event: MouseEvent<HTMLDialogElement>): boolean {
  if (event.target !== event.currentTarget) return false;

  const bounds = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  );
}

type FallbackIsolationRecord = {
  ariaHidden: string | null;
  element: HTMLElement;
  inert: boolean;
  pointerEvents: string;
};

function isolateFallbackModal(dialog: HTMLDialogElement): () => void {
  const records: FallbackIsolationRecord[] = [];
  let branch: HTMLElement = dialog;

  while (branch.parentElement) {
    const parent = branch.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (!(sibling instanceof HTMLElement) || sibling === branch) continue;

      records.push({
        ariaHidden: sibling.getAttribute("aria-hidden"),
        element: sibling,
        inert: sibling.hasAttribute("inert"),
        pointerEvents: sibling.style.pointerEvents
      });
      sibling.setAttribute("inert", "");
      sibling.setAttribute("aria-hidden", "true");
      sibling.style.pointerEvents = "none";
    }
    branch = parent;
  }

  const documentOverflow = document.documentElement.style.overflow;
  const bodyOverflow = document.body.style.overflow;
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  return () => {
    for (const record of records) {
      if (!record.inert) record.element.removeAttribute("inert");
      if (record.ariaHidden === null) record.element.removeAttribute("aria-hidden");
      else record.element.setAttribute("aria-hidden", record.ariaHidden);
      record.element.style.pointerEvents = record.pointerEvents;
    }
    document.documentElement.style.overflow = documentOverflow;
    document.body.style.overflow = bodyOverflow;
  };
}

export function Sheet({
  actions,
  children,
  className,
  onCancel,
  onClick,
  onClose,
  onKeyDown,
  onOpenChange,
  open = false,
  title,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: SheetProps): ReactElement {
  const classNames = ["ag-sheet", className].filter(Boolean).join(" ");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fallbackModalRef = useRef(false);
  const releaseFallbackRef = useRef<(() => void) | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const synchronizingRef = useRef(false);
  const wasOpenRef = useRef(false);
  const generatedTitleId = useId();
  const titleId = `${generatedTitleId}-title`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !wasOpenRef.current) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      fallbackModalRef.current = false;

      try {
        dialog.showModal();
      } catch {
        fallbackModalRef.current = true;
        dialog.setAttribute("open", "");
        dialog.setAttribute("aria-modal", "true");
        releaseFallbackRef.current = isolateFallbackModal(dialog);
      }

      focusSheet(dialog);
    } else if (!open && wasOpenRef.current) {
      synchronizingRef.current = true;
      if (dialog.open) {
        if (typeof dialog.close === "function") dialog.close();
        else dialog.removeAttribute("open");
      }
      synchronizingRef.current = false;
      fallbackModalRef.current = false;
      releaseFallbackRef.current?.();
      releaseFallbackRef.current = null;
      dialog.removeAttribute("aria-modal");
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }

    wasOpenRef.current = open;
  }, [open]);

  useEffect(
    () => () => {
      const dialog = dialogRef.current;
      if (!wasOpenRef.current || !dialog) return;

      synchronizingRef.current = true;
      if (dialog.open) {
        if (typeof dialog.close === "function") dialog.close();
        else dialog.removeAttribute("open");
      }
      synchronizingRef.current = false;
      fallbackModalRef.current = false;
      releaseFallbackRef.current?.();
      releaseFallbackRef.current = null;
      wasOpenRef.current = false;
      dialog.removeAttribute("aria-modal");
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    },
    []
  );

  const requestDismiss = (reason: SheetDismissReason): void => {
    onOpenChange?.(false, { reason });
  };

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    onCancel?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();
    requestDismiss("escape");
  };

  const handleClick = (event: MouseEvent<HTMLDialogElement>): void => {
    onClick?.(event);
    if (!event.defaultPrevented && isBackdropClick(event)) requestDismiss("backdrop");
  };

  const handleClose = (event: SyntheticEvent<HTMLDialogElement>): void => {
    onClose?.(event);
    event.currentTarget.removeAttribute("aria-modal");
    if (!synchronizingRef.current && open) requestDismiss("native-close");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>): void => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !fallbackModalRef.current) return;

    if (event.key === "Escape") {
      event.preventDefault();
      requestDismiss("escape");
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = focusableElements(event.currentTarget);
    if (focusable.length === 0) {
      event.preventDefault();
      event.currentTarget.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      {...props}
      aria-labelledby={ariaLabelledBy ?? titleId}
      className={classNames}
      onCancel={handleCancel}
      onClick={handleClick}
      onClose={handleClose}
      onKeyDown={handleKeyDown}
      ref={dialogRef}
      tabIndex={-1}
    >
      <div className="ag-sheet__surface">
        <header className="ag-sheet__header">
          <h2 className="ag-sheet__title" id={titleId}>
            {title}
          </h2>
          {actions ? <div className="ag-sheet__actions">{actions}</div> : null}
        </header>
        <div className="ag-sheet__body">{children}</div>
      </div>
    </dialog>
  );
}
