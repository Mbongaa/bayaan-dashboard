"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import Image from "next/image";

// UI components
import Transcript from "./components/Transcript";
import Events from "./components/Events";
import BottomToolbar from "./components/BottomToolbar";
import Audio3DOrb from "./components/Audio3DOrb";
import AgentSettingsMenu from "./components/AgentSettingsMenu";
import ThemeToggle from "./components/ThemeToggle";
import Galaxy from "./components/Galaxy";

// Types
import { SessionStatus } from "@/app/types";
import type { RealtimeAgent } from '@openai/agents/realtime';

// Context providers & hooks
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import { useRealtimeSession } from "./hooks/useRealtimeSession";
import { createModerationGuardrail } from "@/app/agentConfigs/guardrails";

// Agent configs
import { allAgentSets, defaultAgentSetKey } from "@/app/agentConfigs";
import { customerServiceRetailScenario } from "@/app/agentConfigs/customerServiceRetail";
import { chatSupervisorScenario } from "@/app/agentConfigs/chatSupervisor";
import { customerServiceRetailCompanyName } from "@/app/agentConfigs/customerServiceRetail";
import { chatSupervisorCompanyName } from "@/app/agentConfigs/chatSupervisor";
import { simpleHandoffScenario } from "@/app/agentConfigs/simpleHandoff";
import { medicalTranslationScenario } from "@/app/agentConfigs/medicalTranslation";
import { medicalTranslationCompanyName } from "@/app/agentConfigs/medicalTranslation";
import { translationScenario } from "@/app/agentConfigs/translation";
import { translationCompanyName } from "@/app/agentConfigs/translation";
import { translationDirectScenario } from "@/app/agentConfigs/translationDirect";
import { translationDirectCompanyName } from "@/app/agentConfigs/translationDirect";

// Map used by connect logic for scenarios defined via the SDK.
const sdkScenarioMap: Record<string, RealtimeAgent[]> = {
  simpleHandoff: simpleHandoffScenario,
  customerServiceRetail: customerServiceRetailScenario,
  chatSupervisor: chatSupervisorScenario,
  medicalTranslation: medicalTranslationScenario,
  translation: translationScenario,
  translationDirect: translationDirectScenario,
};

import useAudioDownload from "./hooks/useAudioDownload";
import { useHandleSessionHistory } from "./hooks/useHandleSessionHistory";

function App() {
  const searchParams = useSearchParams()!;

  // ---------------------------------------------------------------------
  // Codec selector – lets you toggle between wide-band Opus (48 kHz)
  // and narrow-band PCMU/PCMA (8 kHz) to hear what the agent sounds like on
  // a traditional phone line and to validate ASR / VAD behaviour under that
  // constraint.
  //
  // We read the `?codec=` query-param and rely on the `changePeerConnection`
  // hook (configured in `useRealtimeSession`) to set the preferred codec
  // before the offer/answer negotiation.
  // ---------------------------------------------------------------------
  const urlCodec = searchParams.get("codec") || "opus";

  // Agents SDK doesn't currently support codec selection so it is now forced 
  // via global codecPatch at module load 

  const {
    addTranscriptMessage,
    addTranscriptBreadcrumb,
  } = useTranscript();
  const { logClientEvent, logServerEvent } = useEvent();

  const [selectedAgentName, setSelectedAgentName] = useState<string>("");
  const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<
    RealtimeAgent[] | null
  >(null);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  // Ref to identify whether the latest agent switch came from an automatic handoff
  const handoffTriggeredRef = useRef(false);

  const sdkAudioElement = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

  // Attach SDK audio element once it exists (after first render in browser)
  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
    }
  }, [sdkAudioElement]);

  const {
    connect,
    disconnect,
    sendUserText,
    sendEvent,
    interrupt,
    mute,
    sessionRef,
  } = useRealtimeSession({
    onConnectionChange: (s) => setSessionStatus(s as SessionStatus),
    onAgentHandoff: (agentName: string) => {
      handoffTriggeredRef.current = true;
      setSelectedAgentName(agentName);
    },
  });

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [isEventsPaneExpanded, setIsEventsPaneExpanded] =
    useState<boolean>(true);
  const [userText, setUserText] = useState<string>("");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  
  // VAD Settings
  const [vadType, setVadType] = useState<'server_vad' | 'semantic_vad' | 'disabled'>('semantic_vad');
  const [vadSilenceDuration, setVadSilenceDuration] = useState<number>(500);
  const [vadThreshold, setVadThreshold] = useState<number>(0.9);
  const [semanticVadEagerness, setSemanticVadEagerness] = useState<'auto' | 'low' | 'medium' | 'high'>('auto');
  
  // Voice Selection (only changeable before connection)
  const [selectedVoice, setSelectedVoice] = useState<string>('cedar');
  
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState<boolean>(
    () => {
      if (typeof window === 'undefined') return true;
      const stored = localStorage.getItem('audioPlaybackEnabled');
      return stored ? stored === 'true' : true;
    },
  );

  // Theme detection for dynamic Galaxy colors
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  // 🎛️ GALAXY CONFIGURATION - Separate settings for each mode
  const GALAXY_CONFIG = {
    // ===== LIGHT MODE - Complete independent settings =====
    light: {
      transparent: true,
      mouseInteraction: true,
      mouseRepulsion: true,
      density: 8,              // 🎛️ Light mode star count
      glowIntensity: 0.03,    // 🎛️ Light mode brightness/size
      hueShift: 140,           // 🎛️ Light mode color hue (140 = teal/cyan)
      saturation: 0,           // 🎛️ Light mode color intensity (0 = grayscale)
      rotationSpeed: 0.05,     // 🎛️ Light mode rotation speed
      twinkleIntensity: 0,     // 🎛️ Light mode twinkling (0 = off)
      repulsionStrength: 0.5,  // 🎛️ Light mode mouse repulsion
      starSpeed: 0.1,          // 🎛️ Light mode star movement
      speed: 0.6,              // 🎛️ Light mode animation speed
      autoCenterRepulsion: 0   // 🎛️ Light mode center force (0 = off)
    },
    
    // ===== DARK MODE - Complete independent settings =====
    dark: {
      transparent: true,
      mouseInteraction: true,
      mouseRepulsion: true,
      density: 1.4,              // 🎛️ Dark mode star count
      glowIntensity: 0.06,    // 🎛️ Dark mode brightness/size
      hueShift: 240,           // 🎛️ Dark mode color hue (200 = blue tones)
      saturation: 0,         // 🎛️ Dark mode color intensity (slight color)
      rotationSpeed: 0.05,     // 🎛️ Dark mode rotation speed
      twinkleIntensity: 0,     // 🎛️ Dark mode twinkling (0 = off)
      repulsionStrength: 0.5,  // 🎛️ Dark mode mouse repulsion
      starSpeed: 0.1,          // 🎛️ Dark mode star movement
      speed: 0.6,              // 🎛️ Dark mode animation speed
      autoCenterRepulsion: 0   // 🎛️ Dark mode center force (0 = off)
    }
  };

  // Get current theme settings (memoized to prevent unnecessary re-renders)
  const currentGalaxySettings = useMemo(() => 
    isDarkMode ? GALAXY_CONFIG.dark : GALAXY_CONFIG.light, 
    [isDarkMode]
  );

  // Initialize the recording hook.
  const { startRecording, stopRecording, downloadRecording } =
    useAudioDownload();

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    try {
      sendEvent(eventObj);
      logClientEvent(eventObj, eventNameSuffix);
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }
  };

  useHandleSessionHistory();

  // Monitor theme changes for dynamic Galaxy colors
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let finalAgentConfig = searchParams.get("agentConfig");
    if (!finalAgentConfig || !allAgentSets[finalAgentConfig]) {
      finalAgentConfig = defaultAgentSetKey;
      const url = new URL(window.location.toString());
      url.searchParams.set("agentConfig", finalAgentConfig);
      window.location.replace(url.toString());
      return;
    }

    const agents = allAgentSets[finalAgentConfig];
    const agentKeyToUse = agents[0]?.name || "";

    setSelectedAgentName(agentKeyToUse);
    setSelectedAgentConfigSet(agents);
  }, [searchParams]);

  // Auto-connection disabled - user must manually connect
  // useEffect(() => {
  //   if (selectedAgentName && sessionStatus === "DISCONNECTED") {
  //     connectToRealtime();
  //   }
  // }, [selectedAgentName]);

  useEffect(() => {
    if (
      sessionStatus === "CONNECTED" &&
      selectedAgentConfigSet &&
      selectedAgentName
    ) {
      const currentAgent = selectedAgentConfigSet.find(
        (a) => a.name === selectedAgentName
      );
      addTranscriptBreadcrumb(`Agent: ${selectedAgentName}`, currentAgent);
      updateSession(!handoffTriggeredRef.current);
      // Reset flag after handling so subsequent effects behave normally
      handoffTriggeredRef.current = false;
    }
  }, [selectedAgentConfigSet, selectedAgentName, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      updateSession();
    }
  }, [isPTTActive, vadType, vadSilenceDuration, vadThreshold, semanticVadEagerness]);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    logClientEvent({ url: "/session" }, "fetch_session_token_request");
    const tokenResponse = await fetch("/api/session");
    const data = await tokenResponse.json();
    logServerEvent(data, "fetch_session_token_response");

    if (!data.client_secret?.value) {
      logClientEvent(data, "error.no_ephemeral_key");
      console.error("No ephemeral key provided by the server");
      setSessionStatus("DISCONNECTED");
      return null;
    }

    return data.client_secret.value;
  };

  const connectToRealtime = async () => {
    const agentSetKey = searchParams.get("agentConfig") || "default";
    if (sdkScenarioMap[agentSetKey]) {
      if (sessionStatus !== "DISCONNECTED") return;
      setSessionStatus("CONNECTING");

      try {
        const EPHEMERAL_KEY = await fetchEphemeralKey();
        if (!EPHEMERAL_KEY) return;

        // Ensure the selectedAgentName is first so that it becomes the root
        const reorderedAgents = [...sdkScenarioMap[agentSetKey]];
        
        // Update all agents to use the selected voice
        reorderedAgents.forEach(agent => {
          (agent as any).voice = selectedVoice;
        });
        
        const idx = reorderedAgents.findIndex((a) => a.name === selectedAgentName);
        if (idx > 0) {
          const [agent] = reorderedAgents.splice(idx, 1);
          reorderedAgents.unshift(agent);
        }

        const companyName = agentSetKey === 'customerServiceRetail'
          ? customerServiceRetailCompanyName
          : agentSetKey === 'medicalTranslation'
          ? medicalTranslationCompanyName
          : agentSetKey === 'translation'
          ? translationCompanyName
          : agentSetKey === 'translationDirect'
          ? translationDirectCompanyName
          : chatSupervisorCompanyName;
        const guardrail = createModerationGuardrail(companyName);

        await connect({
          getEphemeralKey: async () => EPHEMERAL_KEY,
          initialAgents: reorderedAgents,
          audioElement: sdkAudioElement,
          outputGuardrails: [guardrail],
          extraContext: {
            addTranscriptBreadcrumb,
          },
        });
      } catch (err) {
        console.error("Error connecting via SDK:", err);
        setSessionStatus("DISCONNECTED");
      }
      return;
    }
  };

  const disconnectFromRealtime = () => {
    disconnect();
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);
  };

  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text, true);

    sendClientEvent({
      type: 'conversation.item.create',
      item: {
        id,
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
    sendClientEvent({ type: 'response.create' }, '(simulated user text message)');
  };

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    // Reflect Push-to-Talk UI state by (de)activating server VAD on the
    // backend. The Realtime SDK supports live session updates via the
    // `session.update` event.
    const turnDetection = isPTTActive || vadType === 'disabled'
      ? null
      : vadType === 'semantic_vad'
      ? {
          type: 'semantic_vad',
          eagerness: semanticVadEagerness,
          create_response: true,
        }
      : {
          type: 'server_vad',
          threshold: vadThreshold,
          prefix_padding_ms: 300,
          silence_duration_ms: vadSilenceDuration,
          create_response: true,
        };

    sendEvent({
      type: 'session.update',
      session: {
        turn_detection: turnDetection,
      },
    });

    // Send an initial 'hi' message to trigger the agent to greet the user
    if (shouldTriggerResponse) {
      sendSimulatedUserMessage('hi');
    }
    return;
  }

  const handleSendTextMessage = () => {
    if (!userText.trim()) return;
    interrupt();

    try {
      sendUserText(userText.trim());
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }

    setUserText("");
  };

  const handleTalkButtonDown = () => {
    if (sessionStatus !== 'CONNECTED') return;
    interrupt();

    setIsPTTUserSpeaking(true);
    sendClientEvent({ type: 'input_audio_buffer.clear' }, 'clear PTT buffer');

    // No placeholder; we'll rely on server transcript once ready.
  };

  const handleTalkButtonUp = () => {
    if (sessionStatus !== 'CONNECTED' || !isPTTUserSpeaking)
      return;

    setIsPTTUserSpeaking(false);
    sendClientEvent({ type: 'input_audio_buffer.commit' }, 'commit PTT');
    sendClientEvent({ type: 'response.create' }, 'trigger response PTT');
  };

  const onToggleConnection = useCallback(() => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
    } else {
      connectToRealtime();
    }
  }, [sessionStatus]);

  // Memoize RealtimeProvider context value to prevent unnecessary child re-renders
  const realtimeContextValue = useMemo(() => ({
    sessionStatus,
    onToggleConnection,
    audioElement: audioElementRef.current,
    sessionRef
  }), [sessionStatus, onToggleConnection, audioElementRef.current, sessionRef]);

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgentConfig = e.target.value;
    const url = new URL(window.location.toString());
    url.searchParams.set("agentConfig", newAgentConfig);
    window.location.replace(url.toString());
  };

  const handleSelectedAgentChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newAgentName = e.target.value;
    // Reconnect session with the newly selected agent as root so that tool
    // execution works correctly.
    disconnectFromRealtime();
    setSelectedAgentName(newAgentName);
    // connectToRealtime will be triggered by effect watching selectedAgentName
  };

  // Because we need a new connection, refresh the page when codec changes
  const handleCodecChange = (newCodec: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set("codec", newCodec);
    window.location.replace(url.toString());
  };

  useEffect(() => {
    const storedPushToTalkUI = localStorage.getItem("pushToTalkUI");
    if (storedPushToTalkUI) {
      setIsPTTActive(storedPushToTalkUI === "true");
    }
    const storedLogsExpanded = localStorage.getItem("logsExpanded");
    if (storedLogsExpanded) {
      setIsEventsPaneExpanded(storedLogsExpanded === "true");
    }
    const storedAudioPlaybackEnabled = localStorage.getItem(
      "audioPlaybackEnabled"
    );
    if (storedAudioPlaybackEnabled) {
      setIsAudioPlaybackEnabled(storedAudioPlaybackEnabled === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);

  useEffect(() => {
    localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
  }, [isEventsPaneExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "audioPlaybackEnabled",
      isAudioPlaybackEnabled.toString()
    );
  }, [isAudioPlaybackEnabled]);

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaybackEnabled) {
        audioElementRef.current.muted = false;
        audioElementRef.current.play().catch((err) => {
          console.warn("Autoplay may be blocked by browser:", err);
        });
      } else {
        // Mute and pause to avoid brief audio blips before pause takes effect.
        audioElementRef.current.muted = true;
        audioElementRef.current.pause();
      }
    }

    // Toggle server-side audio stream mute so bandwidth is saved when the
    // user disables playback. 
    try {
      mute(!isAudioPlaybackEnabled);
    } catch (err) {
      console.warn('Failed to toggle SDK mute', err);
    }
  }, [isAudioPlaybackEnabled]);

  // Ensure mute state is propagated to transport right after we connect or
  // whenever the SDK client reference becomes available.
  useEffect(() => {
    if (sessionStatus === 'CONNECTED') {
      try {
        mute(!isAudioPlaybackEnabled);
      } catch (err) {
        console.warn('mute sync after connect failed', err);
      }
    }
  }, [sessionStatus, isAudioPlaybackEnabled]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED" && audioElementRef.current?.srcObject) {
      // The remote audio stream from the audio element.
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }

    // Clean up on unmount or when sessionStatus is updated.
    return () => {
      stopRecording();
    };
  }, [sessionStatus]);

  const agentSetKey = searchParams.get("agentConfig") || "default";

  return (
    <div className="text-base flex flex-col h-screen bg-gray-100 text-gray-800 dark:bg-black dark:text-gray-100 relative">
      {/* Galaxy Background */}
      <div className="fixed inset-0 z-0" style={{ pointerEvents: 'auto' }}>
        <Galaxy {...currentGalaxySettings} />
      </div>
      
      <div className="p-5 text-lg font-semibold flex justify-between items-center bg-transparent border-b border-transparent relative z-10">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <div>
            <Image
              src="/openai-logomark.svg"
              alt="OpenAI Logo"
              width={20}
              height={20}
              className="mr-2"
            />
          </div>
          <div>
            Realtime API <span className="text-gray-500 dark:text-gray-400">Agents</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AgentSettingsMenu
            agentSetKey={agentSetKey}
            allAgentSets={allAgentSets}
            selectedAgentName={selectedAgentName}
            selectedAgentConfigSet={selectedAgentConfigSet}
            onAgentChange={handleAgentChange}
            onSelectedAgentChange={handleSelectedAgentChange}
            vadType={vadType}
            vadSilenceDuration={vadSilenceDuration}
            vadThreshold={vadThreshold}
            semanticVadEagerness={semanticVadEagerness}
            selectedVoice={selectedVoice}
            onVadTypeChange={setVadType}
            onVadSilenceDurationChange={setVadSilenceDuration}
            onVadThresholdChange={setVadThreshold}
            onSemanticVadEagernessChange={setSemanticVadEagerness}
            onVoiceChange={setSelectedVoice}
            codec={urlCodec}
            onCodecChange={handleCodecChange}
            sessionStatus={sessionStatus}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-2 overflow-hidden relative z-10">
        {/* Top half: 3D Audio Visualization */}
        <div className="flex-1 min-h-0 max-h-full overflow-hidden">
          <RealtimeProvider 
            value={realtimeContextValue}
          >
            <Audio3DOrb
              intensity={3.5}
              className="w-full h-full"
            />
          </RealtimeProvider>
        </div>

        {/* Bottom half: Transcript and Events */}
        <div className="flex flex-1 gap-2 overflow-hidden">
          <Transcript
            userText={userText}
            setUserText={setUserText}
            onSendMessage={handleSendTextMessage}
            downloadRecording={downloadRecording}
            canSend={
              sessionStatus === "CONNECTED"
            }
          />

          <Events isExpanded={isEventsPaneExpanded} />
        </div>
      </div>

      <div className="relative z-10">
        <BottomToolbar
        sessionStatus={sessionStatus}
        onToggleConnection={onToggleConnection}
        isPTTActive={isPTTActive}
        setIsPTTActive={setIsPTTActive}
        isPTTUserSpeaking={isPTTUserSpeaking}
        handleTalkButtonDown={handleTalkButtonDown}
        handleTalkButtonUp={handleTalkButtonUp}
        isEventsPaneExpanded={isEventsPaneExpanded}
        setIsEventsPaneExpanded={setIsEventsPaneExpanded}
        isAudioPlaybackEnabled={isAudioPlaybackEnabled}
        setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
        codec={urlCodec}
        onCodecChange={handleCodecChange}
        />
      </div>
    </div>
  );
}

export default App;
