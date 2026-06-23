import React from "react";

interface PinDisplayProps {
  pin: string;
  length?: number;
}

export function PinDisplay({ pin, length = 4 }: PinDisplayProps) {
  // Generar un array de la longitud deseada
  const circles = Array.from({ length }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-4 my-8">
      {circles.map((index) => {
        const isFilled = index < pin.length;
        return (
          <div
            key={index}
            className={`w-4 h-4 rounded-full transition-all duration-200 ease-in-out ${
              isFilled ? "bg-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.7)]" : "bg-zinc-700"
            }`}
          />
        );
      })}
    </div>
  );
}
