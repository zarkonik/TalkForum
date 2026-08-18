import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createReport } from "../../reports/api";
import "./ReportButton.css";

interface ReportButtonProps {
  targetType: number;
  targetId: string;
}

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [isReported, setIsReported] = useState(false);

  const mutation = useMutation({
    mutationFn: (reason: string | null) => createReport({ targetType, targetId, reason }),
    onSuccess: () => setIsReported(true),
  });

  function handleClick() {
    const reason = window.prompt("Why are you reporting this? (optional)");
    if (reason === null) return;
    mutation.mutate(reason || null);
  }

  if (isReported) {
    return (
      <button type="button" className="report-button" disabled>
        Reported
      </button>
    );
  }

  return (
    <button type="button" className="report-button" onClick={handleClick} disabled={mutation.isPending}>
      Report
    </button>
  );
}
