"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
}

export default function OTPInput({
  value,
  onChange,
  disabled = false,
  length = 6,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync with external value
  useEffect(() => {
    if (value) {
      const digits = value.split("").slice(0, length);
      const newOtp = [...Array(length).fill("")];
      digits.forEach((digit, index) => {
        if (index < length) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);
    } else {
      setOtp(Array(length).fill(""));
    }
  }, [value, length]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const updateOtpAndNotify = (newOtp: string[]) => {
    setOtp(newOtp);
    const otpString = newOtp.join("");
    onChange(otpString);
  };

  const handleInputChange = (index: number, inputValue: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(inputValue)) return;

    const newOtp = [...otp];
    newOtp[index] = inputValue;
    updateOtpAndNotify(newOtp);

    // Auto-focus next input if current input is filled
    if (inputValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      if (otp[index]) {
        // If current input has value, clear it
        const newOtp = [...otp];
        newOtp[index] = "";
        updateOtpAndNotify(newOtp);
      } else if (index > 0) {
        // If current input is empty, go to previous input and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        updateOtpAndNotify(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault(); // Prevent number increment/decrement
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text/plain")
      .replace(/\D/g, "")
      .slice(0, length);

    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < length; i++) {
        newOtp[i] = pastedData[i] || "";
      }
      updateOtpAndNotify(newOtp);

      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleInputFocus = (index: number) => {
    // Select all text when input is focused
    inputRefs.current[index]?.select();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-1 sm:gap-2 md:gap-3 w-full">
        {otp.map((digit, index) => (
          <div key={index} className="relative">
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => handleInputFocus(index)}
              className={cn(
                "w-full aspect-square text-center text-lg sm:text-xl md:text-2xl font-bold bg-white/10 border border-white/20 md:border-2 text-white rounded-xl box-border",
                "focus:bg-white/20 focus:border-purple-400 focus:outline-none",
                "transition-all duration-200",
                "placeholder:text-white/30",
                digit && "border-purple-400 bg-white/20",
                "selection:bg-purple-400/30",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              placeholder="•"
              disabled={disabled}
              autoComplete="one-time-code"
              aria-label={`Digit ${index + 1} of ${length}`}
            />

            {/* Active indicator */}
            {digit && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
