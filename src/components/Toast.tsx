"use client";

import { useEffect, useState } from "react";

interface Props {
  message: string;
  onDone: () => void;
  duration?: number;
}

export default function Toast({ message, onDone, duration = 2200 }: Props) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const hide = setTimeout(() => setPhase("out"), duration);
    return () => clearTimeout(hide);
  }, [duration]);

  // 아웃 애니메이션 끝나면 제거
  useEffect(() => {
    if (phase === "out") {
      const done = setTimeout(onDone, 300);
      return () => clearTimeout(done);
    }
  }, [phase, onDone]);

  return (
    <div
      className="fixed bottom-28 left-1/2 z-[70] px-5 py-2.5 rounded-full bg-gray-900/90 backdrop-blur-sm text-white text-sm font-medium pointer-events-none whitespace-nowrap shadow-lg"
      style={{
        animation: phase === "in"
          ? "toastIn 0.25s ease-out both"
          : "toastOut 0.25s ease-in both",
        transform: "translateX(-50%)",
      }}
    >
      {message}
    </div>
  );
}
