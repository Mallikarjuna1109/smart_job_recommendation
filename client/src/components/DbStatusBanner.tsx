import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { api } from "../services/api";

export function DbStatusBanner() {
  const [degraded, setDegraded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      api
        .getHealth()
        .then((health) => {
          if (!cancelled) setDegraded(health.status !== "ok");
        })
        .catch(() => {
          if (!cancelled) setDegraded(true);
        });
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!degraded) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-warning/15 px-4 py-2 text-center text-sm font-medium text-warning">
      <TriangleAlert size={15} className="shrink-0" aria-hidden="true" />
      We're having trouble reaching the job graph database. Some data may be unavailable until this is resolved.
    </div>
  );
}
