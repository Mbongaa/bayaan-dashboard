"use client";

import {
    BlocksIcon,
    BrainIcon,
    LanguagesIcon,
    MessageSquareIcon,
    HeartHandshakeIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
    Dock,
    DockCard,
    DockCardInner,
    DockDivider,
} from "@/app/components/ui/dock";

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const userAgent = navigator.userAgent;
        const isSmall = window.matchMedia("(max-width: 768px)").matches;
        const isMobile = Boolean(
            /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.exec(
                userAgent,
            ),
        );

        const isDev = process.env.NODE_ENV !== "production";
        if (isDev) setIsMobile(isSmall || isMobile);

        setIsMobile(isSmall && isMobile);
    }, []);

    return isMobile;
}

interface DockExampleProps {
    onScenarioSelect?: (scenarioKey: string) => void;
    selectedScenario?: string;
    isConnected?: boolean;
}

// Map dock positions to scenario keys
const scenarioMapping = [
    { key: "chatSupervisor", name: "Chat Supervisor" },
    { key: "translation", name: "Translation" },
    { key: "medicalTranslation", name: "Medical Translation" },
    { key: "customerServiceRetail", name: "Customer Service" },
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

export default function DockExample({ onScenarioSelect, selectedScenario, isConnected }: DockExampleProps) {
    const openIcons = [
        <BrainIcon
            key="1"
            className="h-5 w-5 rounded-full fill-black stroke-black"
        />,
        <LanguagesIcon
            key="2"
            className="h-5 w-5 rounded-full fill-black stroke-black"
        />,
        <HeartHandshakeIcon
            key="3"
            className="h-5 w-5 rounded-full fill-black stroke-black"
        />,
        <MessageSquareIcon
            key="4"
            className="h-5 w-5 rounded-full fill-black stroke-black"
        />,
        null,
        <BlocksIcon
            key="7"
            className="h-5 w-5 rounded-full fill-black stroke-black"
        />,
    ];

    const isMobile = useIsMobile();

    const responsiveOpenIcons = isMobile
        ? openIcons.slice(3, openIcons.length)
        : openIcons;
    const responsiveGradients = isMobile
        ? gradients.slice(3, gradients.length)
        : gradients;
    const responsiveScenarios = isMobile
        ? scenarioMapping.slice(3, scenarioMapping.length)
        : scenarioMapping;

    return (
        <Dock>
            {responsiveGradients.map((src, index) =>
                src ? (
                    <DockCard
                        key={src}
                        id={`${index}`}
                        scenarioKey={responsiveScenarios[index]?.key}
                        onScenarioSelect={onScenarioSelect}
                        isSelected={selectedScenario === responsiveScenarios[index]?.key}
                        isConnected={isConnected}
                    >
                        <DockCardInner src={src} id={`${index}`}>
                            {responsiveOpenIcons[index]}
                        </DockCardInner>
                    </DockCard>
                ) : (
                    <DockDivider key={index} />
                ),
            )}
        </Dock>
    );
}