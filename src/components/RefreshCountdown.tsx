import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export const RefreshCountdown = () => {
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 1800; // Reset to 30 minutes
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-lg backdrop-blur-sm">
      <Clock className="h-4 w-4 animate-pulse-glow" />
      <div className="text-sm">
        <div className="font-semibold">Next Refresh</div>
        <div className="text-xs tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};
