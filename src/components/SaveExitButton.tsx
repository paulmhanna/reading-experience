import { progressStore } from "@/lib/progress";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

export function SaveExitButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const onClick = () => {
    progressStore.saveAndExit();
    navigate({ to: "/" });
  };
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl bg-secondary/70 hover:bg-secondary border border-accent/40 text-foreground font-bold flex items-center gap-2 transition ${className}`}
      title="حفظ التّقدّم والعودة إلى الصّفحة الرّئيسيّة"
    >
      <LogOut className="w-4 h-4" />
      حفظ والخروج
    </button>
  );
}
