import { useEffect } from "react";
import { Cancel01Icon } from "hugeicons-react";

interface SidePanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string;
}

export function SidePanel({
  title,
  onClose,
  children,
  widthClassName = "max-w-md",
}: SidePanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`animate-slide-in-right relative flex h-full w-full ${widthClassName} flex-col bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <Cancel01Icon size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
