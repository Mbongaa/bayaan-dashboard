import React, { Suspense } from "react";
import { TranscriptProvider } from "@/app/foundation/contexts/TranscriptContext";
import { EventProvider } from "@/app/foundation/contexts/EventContext";
import App from "./App";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TranscriptProvider>
        <EventProvider>
          <App />
        </EventProvider>
      </TranscriptProvider>
    </Suspense>
  );
}
