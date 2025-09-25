import {
  HTMLAttributes,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Setter<T> = (value: T | ((value: T) => T)) => void;

type BoundingBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const ArtifactSlotContext = createContext<{
  open: [string | null, Setter<string | null>];
  mounted: [string | null, Setter<string | null>];

  title: [HTMLElement | null, Setter<HTMLElement | null>];
  content: [HTMLElement | null, Setter<HTMLElement | null>];

  context: [Record<string, unknown>, Setter<Record<string, unknown>>];
  boundingBox: [BoundingBox, Setter<BoundingBox>];
}>(null!);

/**
 * Headless component that will obtain the title and content of the artifact
 * and render them in place of the `ArtifactContent` and `ArtifactTitle` components via
 * React Portals.
 */
const ArtifactSlot = (props: {
  id: string;
  children?: ReactNode;
  title?: ReactNode;
}) => {
  const context = useContext(ArtifactSlotContext);

  const [ctxMounted, ctxSetMounted] = context.mounted;
  const [content] = context.content;
  const [title] = context.title;

  const isMounted = ctxMounted === props.id;
  const isEmpty = props.children == null && props.title == null;

  useEffect(() => {
    if (isEmpty) {
      ctxSetMounted((open) => (open === props.id ? null : open));
    }
  }, [isEmpty, ctxSetMounted, props.id]);

  if (!isMounted) return null;
  return (
    <>
      {title != null ? createPortal(<>{props.title}</>, title) : null}
      {content != null ? createPortal(<>{props.children}</>, content) : null}
    </>
  );
};

export function ArtifactContent(props: HTMLAttributes<HTMLDivElement>) {
  const context = useContext(ArtifactSlotContext);

  const [mounted] = context.mounted;
  const ref = useRef<HTMLDivElement>(null);
  const [, setStateRef] = context.content;

  useLayoutEffect(
    () => setStateRef?.(mounted ? ref.current : null),
    [setStateRef, mounted],
  );

  if (!mounted) return null;
  return (
    <div
      {...props}
      ref={ref}
    />
  );
}

export function ArtifactTitle(props: HTMLAttributes<HTMLDivElement>) {
  const context = useContext(ArtifactSlotContext);

  const ref = useRef<HTMLDivElement>(null);
  const [, setStateRef] = context.title;

  useLayoutEffect(() => setStateRef?.(ref.current), [setStateRef]);

  return (
    <div
      {...props}
      ref={ref}
    />
  );
}

export function ArtifactProvider(props: { children?: ReactNode }) {
  const content = useState<HTMLElement | null>(null);
  const title = useState<HTMLElement | null>(null);

  const open = useState<string | null>(null);
  const mounted = useState<string | null>(null);
  const context = useState<Record<string, unknown>>({});

  const boundingBox = useState<BoundingBox>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const [, setBoundingBox] = boundingBox;

  // Initialize a sensible default bounding box (centered) and track last clicked element
  useEffect(() => {
    // Set a centered default box for first-time opens
    try {
      if (typeof window !== "undefined") {
        const w = window.innerWidth || 0;
        const h = window.innerHeight || 0;
        if (w > 0 && h > 0) {
          setBoundingBox((prev) =>
            prev.width > 0 && prev.height > 0
              ? prev
              : {
                  left: Math.max(0, Math.round(w / 2 - 150)),
                  top: Math.max(0, Math.round(h / 2 - 100)),
                  width: 300,
                  height: 200,
                },
          );
        }
      }
    } catch {
      // no-op
    }

    // Capture the last mousedown target's bounding client rect as the animation origin
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.getBoundingClientRect) return;
      try {
        const rect = target.getBoundingClientRect();
        if (!rect) return;
        setBoundingBox({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      } catch {
        // no-op
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("mousedown", handler, { capture: true });
    }
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("mousedown", handler, { capture: true } as any);
      }
    };
  }, [setBoundingBox]);

  return (
    <ArtifactSlotContext.Provider
      value={{ open, mounted, title, content, context, boundingBox }}
    >
      {props.children}
    </ArtifactSlotContext.Provider>
  );
}

/**
 * Provides a value to be passed into `meta.artifact` field
 * of the `LoadExternalComponent` component, to be consumed by the `useArtifact` hook
 * on the generative UI side.
 */
export function useArtifact() {
  const id = useId();
  const context = useContext(ArtifactSlotContext);
  const [ctxOpen, ctxSetOpen] = context.open;
  const [ctxContext, ctxSetContext] = context.context;
  const [, ctxSetMounted] = context.mounted;

  const open = ctxOpen === id;
  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      if (typeof value === "boolean") {
        ctxSetOpen(value ? id : null);
      } else {
        ctxSetOpen((open) => (open === id ? null : id));
      }

      ctxSetMounted(id);
    },
    [ctxSetOpen, ctxSetMounted, id],
  );

  const ArtifactContent = useCallback(
    (props: { title?: React.ReactNode; children: React.ReactNode }) => {
      return (
        <ArtifactSlot
          id={id}
          title={props.title}
        >
          {props.children}
        </ArtifactSlot>
      );
    },
    [id],
  );

  return [
    ArtifactContent,
    { open, setOpen, context: ctxContext, setContext: ctxSetContext },
  ] as [
    typeof ArtifactContent,
    {
      open: typeof open;
      setOpen: typeof setOpen;
      context: typeof ctxContext;
      setContext: typeof ctxSetContext;
    },
  ];
}

/**
 * General hook for detecting if any artifact is open.
 */
export function useArtifactOpen() {
  const context = useContext(ArtifactSlotContext);
  const [ctxOpen, setCtxOpen] = context.open;

  const open = ctxOpen !== null;
  const onClose = useCallback(() => setCtxOpen(null), [setCtxOpen]);

  return [open, onClose] as const;
}

/**
 * Artifacts may at their discretion provide additional context
 * that will be used when creating a new run.
 */
export function useArtifactContext() {
  const context = useContext(ArtifactSlotContext);
  return context.context;
}

/**
 * Hook to read the last-click bounding box for animating artifact overlays
 * from the source element (Supabase parity behavior).
 */
export function useArtifactBoundingBox() {
  const context = useContext(ArtifactSlotContext);
  return context.boundingBox[0];
}
