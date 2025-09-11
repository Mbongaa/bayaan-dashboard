"use client";

import React, { Suspense } from "react";
import { TranscriptProvider } from "@/app/foundation/contexts/TranscriptContext";
import { EventProvider } from "@/app/foundation/contexts/EventContext";
import App from "../../App";

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">
      <div className="text-xl text-gray-400">Loading workspace...</div>
    </div>}>
      <TranscriptProvider>
        <EventProvider>
          <App />
        </EventProvider>
      </TranscriptProvider>
    </Suspense>
  );
}