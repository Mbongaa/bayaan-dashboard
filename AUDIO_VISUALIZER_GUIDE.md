# Audio Visualizer Implementation Guide

This guide documents the complete implementation of the 3D Audio Orb visualizer in the realtime translation agent application. Use this as a reference for understanding the current architecture or building upon it.

## Overview

The audio visualizer is a **3D wireframe icosahedron** that morphs in real-time based on WebRTC audio data. It's built using Three.js and integrates seamlessly with the OpenAI Realtime API session management.

## Architecture Components

### 1. Core Components

#### `Audio3DOrb` Component
**Location**: `src/app/components/Audio3DOrb.tsx`
**Purpose**: Main 3D orb visualization component

**Key Features**:
- Wireframe icosahedron geometry with 8 subdivision levels
- Real-time vertex morphing based on audio volume
- Smooth rotation animation
- Responsive sizing that fits any container
- Click-to-connect/disconnect functionality

**Props**:
```typescript
interface Audio3DOrbProps {
  intensity?: number;  // Animation intensity (default: 3)
  className?: string;  // CSS classes
}
```

#### `useWebRTCAudioSession` Hook
**Location**: `src/app/hooks/useWebRTCAudioSession.ts`
**Purpose**: Provides audio analysis and session management

**Interface**:
```typescript
interface UseWebRTCAudioSessionReturn {
  currentVolume: number;        // Real-time audio volume (0-1)
  isSessionActive: boolean;     // WebRTC connection status
  handleStartStopClick: () => void; // Connect/disconnect function
}
```

#### `RealtimeContext`
**Location**: `src/app/contexts/RealtimeContext.tsx`
**Purpose**: Bridges orb component with main app session management

**Context Value**:
```typescript
interface RealtimeContextValue {
  sessionStatus: SessionStatus;     // 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'
  onToggleConnection: () => void;   // Main app's connection handler
  audioElement: HTMLAudioElement | null; // WebRTC audio element
}
```

### 2. Integration Points

#### App.tsx Integration
```tsx
// Wrap the orb with RealtimeProvider
<RealtimeProvider 
  value={{
    sessionStatus,
    onToggleConnection,
    audioElement: audioElementRef.current
  }}
>
  <Audio3DOrb intensity={3} className="w-full h-full" />
</RealtimeProvider>
```

#### Connection to Existing Session Management
- Uses existing `connectToRealtime()` and `disconnectFromRealtime()` functions
- Leverages current `sessionStatus` state management
- Accesses the same `audioElementRef` that receives WebRTC streams

## Technical Implementation Details

### 3D Rendering (Three.js)

#### Scene Setup
```typescript
// Camera configuration
const camera = new THREE.PerspectiveCamera(20, 1, 1, 100);
camera.position.set(0, 0, 100);

// Geometry and material
const icosahedronGeometry = new THREE.IcosahedronGeometry(10, 8);
const lambertMaterial = new THREE.MeshLambertMaterial({
  color: 0xffffff,
  wireframe: true,
});

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const spotLight = new THREE.SpotLight(0xffffff);
spotLight.intensity = 0.9;
spotLight.position.set(-10, 40, 20);
```

#### Responsive Sizing
```typescript
// Fit container dimensions
const containerWidth = outElement.clientWidth;
const containerHeight = outElement.clientHeight;
const size = Math.min(containerWidth, containerHeight);
renderer.setSize(size, size);

// Center and scale canvas
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.objectFit = 'contain';
renderer.domElement.style.display = 'block';
renderer.domElement.style.margin = 'auto';
```

### Audio Analysis (Web Audio API)

#### MediaStream Connection
```typescript
// Connect to WebRTC audio stream
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 512;

const source = audioContext.createMediaStreamSource(
  audioElement.srcObject as MediaStream
);
source.connect(analyser);
```

#### Volume Calculation
```typescript
// Real-time volume analysis
analyser.getByteFrequencyData(dataArray);

// Calculate RMS volume
let sum = 0;
for (let i = 0; i < dataArray.length; i++) {
  sum += dataArray[i] * dataArray[i];
}
const rawVolume = Math.sqrt(sum / dataArray.length) / 255;

// Apply smoothing (moving average + exponential smoothing)
const smoothedVolume = volumeHistory.reduce((a, b) => a + b, 0) / volumeHistory.length;
const finalVolume = previousVolume * 0.7 + smoothedVolume * 0.3;
```

### Vertex Morphing Algorithm

#### Core Morphing Logic
```typescript
const updateBallMorph = (mesh: THREE.Mesh, volume: number) => {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const positionAttribute = geometry.getAttribute("position");

  for (let i = 0; i < positionAttribute.count; i++) {
    // Get current vertex position
    const vertex = new THREE.Vector3(
      positionAttribute.getX(i),
      positionAttribute.getY(i),
      positionAttribute.getZ(i)
    );

    // Apply noise-based morphing
    const offset = 10; // Base radius
    const amp = 2.5;   // Morphing amplitude
    const time = window.performance.now();
    
    vertex.normalize();
    const distance = offset + 
      volume * 4 * intensity + 
      noise(
        vertex.x + time * 0.00007,
        vertex.y + time * 0.00008,
        vertex.z + time * 0.00009
      ) * amp * volume * intensity;
    
    vertex.multiplyScalar(distance);
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals();
};
```

#### Animation States
- **Disconnected**: Static icosahedron with gentle rotation
- **Connected**: Morphing based on real-time audio volume
- **Active Audio**: High-intensity morphing synchronized with voice

## Data Flow

### 1. WebRTC Audio Stream Flow
```
OpenAI Realtime API → MediaStream → audioElement.srcObject → Web Audio API → Volume Analysis → Orb Morphing
```

### 2. Session Management Flow
```
User Click → handleStartStopClick → onToggleConnection → connectToRealtime/disconnectFromRealtime → sessionStatus Update → Orb State Change
```

### 3. Context Flow
```
App.tsx → RealtimeProvider → useRealtimeContext → useWebRTCAudioSession → Audio3DOrb
```

## File Structure

```
src/app/
├── components/
│   └── Audio3DOrb.tsx              # Main 3D orb component
├── hooks/
│   └── useWebRTCAudioSession.ts    # Audio analysis and session hook
├── contexts/
│   └── RealtimeContext.tsx         # Session context provider
└── App.tsx                         # Integration point
```

## Key Design Decisions

### 1. Modular Architecture
- **Why**: Separation of concerns, reusability, testability
- **Implementation**: Hook-based audio logic, context for session management
- **Benefit**: Easy to modify audio analysis without touching 3D rendering

### 2. Context-Based Integration
- **Why**: Avoid prop drilling, maintain existing app architecture
- **Implementation**: RealtimeProvider wraps the orb component
- **Benefit**: Orb component stays self-contained while accessing app state

### 3. Preview Code Compatibility
- **Why**: Maintain compatibility with openai-realtime-blocks examples
- **Implementation**: Exact same hook interface as preview expects
- **Benefit**: Easy to swap with other realtime block components

### 4. Audio Smoothing Strategy
- **Why**: Prevent chaotic/jittery orb movement
- **Implementation**: Moving average + exponential smoothing + volume clamping
- **Benefit**: Smooth, natural-looking animations

## Performance Considerations

### 1. Audio Analysis Optimization
- **FFT Size**: 512 (balance between accuracy and performance)
- **Analysis Rate**: ~60fps via requestAnimationFrame
- **Memory Management**: Proper cleanup of AudioContext on unmount

### 2. 3D Rendering Optimization
- **Geometry**: Fixed subdivision level (8) for consistent performance
- **Update Strategy**: Only update vertices when volume changes
- **Canvas Sizing**: Responsive but capped to container dimensions

### 3. Memory Leaks Prevention
```typescript
// Cleanup pattern
useEffect(() => {
  return () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };
}, []);
```

## Troubleshooting Common Issues

### 1. "Thick horizontal lines" in wireframe
- **Cause**: Using current vertex positions instead of original positions for morphing
- **Solution**: Always start morphing from `originalPositionsRef.current` positions

### 2. Orb not responding to audio
- **Check**: `audioElement.srcObject` exists and contains MediaStream
- **Check**: AudioContext is created after user interaction (Chrome policy)
- **Check**: Session is in 'CONNECTED' state

### 3. TypeScript errors with Uint8Array
- **Solution**: Use explicit typing `Uint8Array<ArrayBuffer>`
- **Example**: `new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>`

### 4. Orb overflow/sizing issues
- **Solution**: Use `Math.min(containerWidth, containerHeight)` for size
- **CSS**: Apply `objectFit: 'contain'` and flexbox centering

## Extending the Visualizer

### Adding New Morphing Effects
```typescript
// Example: Add frequency-based coloring
const updateBallColor = (mesh: THREE.Mesh, frequencyData: Uint8Array) => {
  const material = mesh.material as THREE.MeshLambertMaterial;
  const bassLevel = frequencyData.slice(0, 50).reduce((a, b) => a + b) / 50;
  const hue = (bassLevel / 255) * 360;
  material.color.setHSL(hue / 360, 1, 0.5);
};
```

### Adding Animation Presets
```typescript
// Example: Different morphing intensities
const presets = {
  subtle: { intensity: 1, smoothing: 0.8 },
  normal: { intensity: 3, smoothing: 0.3 },
  dramatic: { intensity: 8, smoothing: 0.1 },
};
```

### Supporting Multiple Visualizer Types
```typescript
// Example: Factory pattern for different visualizers
const createVisualizer = (type: 'orb' | 'waveform' | 'particles') => {
  switch (type) {
    case 'orb': return new OrbVisualizer();
    case 'waveform': return new WaveformVisualizer();
    case 'particles': return new ParticleVisualizer();
  }
};
```

## Dependencies

### Required Packages
```json
{
  "three": "^0.x.x",              // 3D graphics library
  "simplex-noise": "^4.x.x",      // Noise generation for morphing
  "@types/three": "^0.x.x"        // TypeScript definitions
}
```

### Browser Requirements
- **WebGL**: Required for Three.js rendering
- **Web Audio API**: Required for audio analysis
- **MediaStream**: Required for WebRTC audio access
- **Modern Browser**: Chrome 88+, Firefox 84+, Safari 14+

## Testing Strategy

### Unit Testing
- Test audio volume calculations with mock data
- Test morphing algorithm with known vertex positions
- Test context provider with mock session states

### Integration Testing
- Test complete audio flow with mock MediaStream
- Test session state changes and orb responses
- Test responsive sizing in different containers

### Performance Testing
- Monitor frame rates during active morphing
- Check memory usage over extended sessions
- Test audio analysis CPU impact

## Migration Guide

### From Previous AudioVisualization Component
1. Remove old `AudioVisualization.tsx` component
2. Replace with `Audio3DOrb` component
3. Wrap with `RealtimeProvider` in App.tsx
4. Update props to use new interface

### To Custom Visualizer
1. Create new component implementing same hook interface
2. Use `useWebRTCAudioSession` for audio data
3. Access `useRealtimeContext` for session management
4. Follow same responsive sizing patterns

---

*This guide documents the current implementation as of the latest update. Keep this file updated when making architectural changes to maintain accuracy for future development.*