"use client";

import {
    BlocksIcon,
    BrainIcon,
    LanguagesIcon,
    MessageSquareIcon,
    HeartHandshakeIcon,
} from "lucide-react";

import {
    Dock,
    DockCard,
    DockCardInner,
    DockDivider,
} from "@/app/components/ui/dock";


interface DockExampleProps {
    onScenarioSelect?: (scenarioKey: string) => void;
    onDisconnect?: () => void;
    selectedScenario?: string;
    isConnected?: boolean;
}

// Map dock positions to scenario keys
const scenarioMapping = [
    { key: "bayaanGeneral", name: "Bayaan General" },
    { key: "simpleHandoff", name: "Simple Handoff" },
    { key: "customerServiceRetail", name: "Customer Service" },
    { key: "chatSupervisor", name: "Chat Supervisor" },
    null, // Divider
    { key: "translationDirect", name: "Direct Translation" },
];

const gradients = [
    "https://products.ls.graphics/mesh-gradients/images/03.-Snowy-Mint_1-p-130x130q80.jpeg",
    "https://products.ls.graphics/mesh-gradients/images/04.-Hopbush_1-p-130x130q80.jpeg",
    "https://products.ls.graphics/mesh-gradients/images/06.-Wisteria-p-130x130q80.jpeg",
    "https://products.ls.graphics/mesh-gradients/images/09.-Light-Sky-Blue-p-130x130q80.jpeg",
    null,
    "https://products.ls.graphics/mesh-gradients/images/36.-Pale-Chestnut-p-130x130q80.jpeg",
];

export default function DockExample({ onScenarioSelect, onDisconnect, selectedScenario, isConnected }: DockExampleProps) {
    const openIcons = [
        <BrainIcon
            key="1"
            className="h-5 w-5 rounded-full fill-black stroke-black dark:fill-white dark:stroke-white"
        />,
        <LanguagesIcon
            key="2"
            className="h-5 w-5 rounded-full fill-black stroke-black dark:fill-white dark:stroke-white"
        />,
        <HeartHandshakeIcon
            key="3"
            className="h-5 w-5 rounded-full fill-black stroke-black dark:fill-white dark:stroke-white"
        />,
        <MessageSquareIcon
            key="4"
            className="h-5 w-5 rounded-full fill-black stroke-black dark:fill-white dark:stroke-white"
        />,
        null,
        <BlocksIcon
            key="7"
            className="h-5 w-5 rounded-full fill-black stroke-black dark:fill-white dark:stroke-white"
        />,
    ];

    return (
        <Dock>
            {gradients.map((src, index) =>
                src ? (
                    <DockCard
                        key={src}
                        id={`${index}`}
                        scenarioKey={scenarioMapping[index]?.key}
                        onScenarioSelect={onScenarioSelect}
                        onDisconnect={onDisconnect}
                        isSelected={selectedScenario === scenarioMapping[index]?.key}
                        isConnected={isConnected}
                    >
                        <DockCardInner src={src} id={`${index}`}>
                            {openIcons[index]}
                        </DockCardInner>
                    </DockCard>
                ) : (
                    <DockDivider key={index} />
                ),
            )}
        </Dock>
    );
}