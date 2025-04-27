import { useState, useCallback, useEffect, RefObject } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  startPosition: Position | null;
  currentPosition: Position;
}

interface UsePreviewDragProps {
  containerRef: RefObject<HTMLElement>;
  previewRef: RefObject<HTMLElement>;
  onPositionChange?: (position: Position) => void;
  bounds?: boolean;
}

export function usePreviewDrag({
  containerRef,
  previewRef,
  onPositionChange,
  bounds = true
}: UsePreviewDragProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: null,
    currentPosition: { x: 0, y: 0 }
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!previewRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const previewRect = previewRef.current.getBoundingClientRect();

    setDragState({
      isDragging: true,
      startPosition: {
        x: e.clientX - (previewRect.left - containerRect.left),
        y: e.clientY - (previewRect.top - containerRect.top)
      },
      currentPosition: {
        x: previewRect.left - containerRect.left,
        y: previewRect.top - containerRect.top
      }
    });
  }, [previewRef, containerRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    e.preventDefault();
    if (!dragState.isDragging || !dragState.startPosition || !containerRef.current || !previewRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const previewRect = previewRef.current.getBoundingClientRect();

    // Calculate position as percentage
    let x = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    let y = ((e.clientY - containerRect.top) / containerRect.height) * 100;

    if (bounds) {
      // Account for preview size when calculating bounds
      const previewWidthPercent = (previewRect.width / containerRect.width) * 100;
      const previewHeightPercent = (previewRect.height / containerRect.height) * 100;

      x = Math.max(previewWidthPercent/2, Math.min(x, 100 - previewWidthPercent/2));
      y = Math.max(previewHeightPercent/2, Math.min(y, 100 - previewHeightPercent/2));
    }

    const position = { x, y };
    setDragState(prev => ({
      ...prev,
      currentPosition: position
    }));
    onPositionChange?.(position);
  }, [dragState.isDragging, dragState.startPosition, containerRef, previewRef, bounds, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      startPosition: null
    }));
  }, []);

  const resetPosition = useCallback(() => {
    setDragState({
      isDragging: false,
      startPosition: null,
      currentPosition: { x: 0, y: 0 }
    });
  }, []);

  return {
    isDragging: dragState.isDragging,
    position: dragState.currentPosition,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetPosition
  };
}