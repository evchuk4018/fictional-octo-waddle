"use client";

import { useEffect, useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { AnimatePresence, Reorder, animate, motion, useDragControls, useMotionValue } from "framer-motion";
import { DailyTask } from "../../types/db";
import { cn } from "../../lib/utils";
import { reorderLayoutTransition, reorderLiftTransition } from "../../lib/motion";

type TaskItemProps = {
  task: DailyTask;
  onToggle: (next: boolean) => void;
  onDelete?: () => void;
  isReorderEnabled?: boolean;
  disableSwipe?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onReorderStart?: () => void;
  onReorderEnd?: () => void;
  onReorderMove?: (offsetY: number) => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
  reducedMotion?: boolean;
};

const SWIPE_DELETE_THRESHOLD = -80;
const SWIPE_MID_TONE_THRESHOLD = -30;
const SWIPE_HIGH_TONE_THRESHOLD = -70;
const SWIPE_INTENT_DEADZONE = 14;
const RELEASE_BOUNCE = {
  type: "spring" as const,
  stiffness: 420,
  damping: 28,
  mass: 0.7
};

export function TaskItem({
  task,
  onToggle,
  onDelete,
  isReorderEnabled = false,
  disableSwipe = false,
  onSwipeStart,
  onSwipeEnd,
  onReorderStart,
  onReorderEnd,
  onReorderMove,
  isDragging = false,
  isDropTarget = false,
  reducedMotion = false
}: TaskItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeIntentActive, setIsSwipeIntentActive] = useState(false);
  const dragControls = useDragControls();
  const x = useMotionValue(0);

  useEffect(() => {
    if (!disableSwipe) return;
    const controls = animate(x, 0, RELEASE_BOUNCE);
    setSwipeOffset(0);
    return () => controls.stop();
  }, [disableSwipe, x]);

  const swipeToneClass =
    swipeOffset <= SWIPE_HIGH_TONE_THRESHOLD
      ? "border-red-300 bg-red-100"
      : swipeOffset <= SWIPE_MID_TONE_THRESHOLD
        ? "border-red-200 bg-red-50"
        : "border-accent bg-card";

  const isPastDeleteThreshold = swipeOffset <= SWIPE_DELETE_THRESHOLD;

  const itemContent = (
    <motion.label
      className={cn(
        "relative flex items-center gap-3 overflow-hidden rounded-button border px-4 py-3 transition-colors",
        swipeToneClass,
        isDragging ? "shadow-lg" : "shadow-none",
        isDropTarget ? "ring-2 ring-accent bg-background/70" : ""
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ x }}
      drag={onDelete && !disableSwipe ? "x" : false}
      dragDirectionLock
      dragPropagation={false}
      dragConstraints={{ left: -120, right: 0 }}
      dragElastic={0.1}
      whileDrag={reducedMotion ? undefined : { scale: 0.99 }}
      onDrag={(_, info) => {
        if (disableSwipe) return;
        setSwipeOffset(info.offset.x);

        if (!onDelete || isSwipeIntentActive) return;
        if (Math.abs(info.offset.x) >= SWIPE_INTENT_DEADZONE) {
          setIsSwipeIntentActive(true);
          onSwipeStart?.();
        }
      }}
      onDragEnd={(_, info) => {
        setSwipeOffset(0);

        animate(x, 0, RELEASE_BOUNCE);

        if (isSwipeIntentActive) {
          onSwipeEnd?.();
          setIsSwipeIntentActive(false);
        }

        if (disableSwipe || !onDelete) return;
        if (info.offset.x <= SWIPE_DELETE_THRESHOLD) {
          onDelete();
        }
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="flex min-w-0 flex-1 items-center gap-3"
        animate={{ opacity: isPastDeleteThreshold ? 0 : 1 }}
        transition={{ duration: 0.12 }}
      >
        {isReorderEnabled ? (
          <button
            type="button"
            aria-label={`Reorder ${task.title}`}
            className="touch-none rounded p-1 text-text-secondary"
            onPointerDown={(event) => dragControls.start(event)}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(event) => onToggle(event.target.checked)}
          aria-label={`Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`}
          className="h-5 w-5 rounded border-accent text-primary focus:ring-primary"
        />
        <span className={cn("text-sm", task.completed ? "text-text-secondary line-through" : "text-text-primary")}>
          {task.title}
        </span>
      </motion.div>

      <AnimatePresence>
        {isPastDeleteThreshold ? (
          <motion.span
            key="delete-indicator"
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-red-700"
            initial={{ opacity: 0, scale: 0.6, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -2 }}
            transition={{ type: "spring", stiffness: 360, damping: 24 }}
          >
            <Trash2 className="h-4 w-4" />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.label>
  );

  if (!isReorderEnabled) {
    return itemContent;
  }

  return (
    <Reorder.Item
      value={task}
      layout
      transition={reorderLayoutTransition(reducedMotion)}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => onReorderStart?.()}
      onDragEnd={() => onReorderEnd?.()}
      onDrag={(_, info) => onReorderMove?.(info.offset.y)}
      className="list-none"
      whileDrag={reducedMotion ? undefined : { scale: 1.01 }}
    >
      <motion.div transition={reorderLiftTransition(reducedMotion)}>{itemContent}</motion.div>
    </Reorder.Item>
  );
}
