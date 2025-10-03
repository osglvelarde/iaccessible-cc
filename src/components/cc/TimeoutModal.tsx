"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { startIdleTimer } from "@/lib/idle-session";

export default function TimeoutModal() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(120); // seconds

  useEffect(() => {
    const stop = startIdleTimer({
      onWarn: () => { setOpen(true); setCount(120); },
      onExpire: () => { window.location.href = "/"; } // or /login if you prefer
    });
    let t: number;
    if (open) {
      t = window.setInterval(() => setCount(c => Math.max(0, c-1)), 1000);
    }
    return () => { stop(); if (t) window.clearInterval(t); };
  }, [open]);

  const continueSession = () => {
    setOpen(false);
    document.dispatchEvent(new Event("mousemove")); // resets idle timer
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby="timeout-desc" aria-modal="true">
        <DialogHeader>
          <DialogTitle>Session timing out</DialogTitle>
          <DialogDescription id="timeout-desc">
            Your session will end in <strong aria-live="polite">{count}</strong> seconds.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => window.location.assign("/login")}>Sign out</Button>
          <Button onClick={continueSession} autoFocus>Continue session</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

