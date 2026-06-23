import React from "react";
import { Delete } from "lucide-react";

interface PinPadProps {
  onDigitPress: (digit: string) => void;
  onDeletePress: () => void;
  disabled?: boolean;
}

export function PinPad({ onDigitPress, onDeletePress, disabled = false }: PinPadProps) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="grid grid-cols-3 gap-6 max-w-[300px] w-full mx-auto">
      {digits.map((digit) => (
        <button
          key={digit}
          disabled={disabled}
          onClick={() => onDigitPress(digit)}
          className="flex items-center justify-center w-20 h-20 rounded-full bg-zinc-800 text-3xl font-medium text-white shadow-md active:bg-zinc-700 active:scale-95 transition-all mx-auto disabled:opacity-50"
        >
          {digit}
        </button>
      ))}

      {/* Fila inferior */}
      <div className="col-span-1"></div>
      
      <button
        disabled={disabled}
        onClick={() => onDigitPress("0")}
        className="flex items-center justify-center w-20 h-20 rounded-full bg-zinc-800 text-3xl font-medium text-white shadow-md active:bg-zinc-700 active:scale-95 transition-all mx-auto disabled:opacity-50"
      >
        0
      </button>

      <button
        disabled={disabled}
        onClick={onDeletePress}
        className="flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900 text-3xl text-zinc-400 active:bg-zinc-800 active:text-zinc-200 active:scale-95 transition-all mx-auto disabled:opacity-50"
      >
        <Delete size={32} />
      </button>
    </div>
  );
}
