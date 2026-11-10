import { GradFlow, type GradFlowProps } from "gradflow"
import { useTheme, type Theme } from "@/lib/theme"

// The backdrop: a silk gradient rendered in WebGL (gradflow).
//
// The dark configuration is the design's source colour: the three colours of
// this gradient are what the whole palette in index.css is drawn from. The
// light theme weaves the same silk from lavender and white, so switching
// themes changes the light, not the material. gradflow blends a change of
// configuration over its `transition`, pauses offscreen and in hidden tabs,
// and honours prefers-reduced-motion on its own.

const SILK: Record<Theme, NonNullable<GradFlowProps["config"]>> = {
  dark: {
    type: "silk",
    color1: "#4632dc",
    color2: "#a096ff",
    color3: "#06061c",
    speed: 0.4,
    scale: 1.2,
    noise: 0.1,
  },
  light: {
    type: "silk",
    color1: "#a096ff",
    color2: "#ffffff",
    color3: "#dcd6ff",
    speed: 0.4,
    scale: 1.2,
    noise: 0.1,
  },
}

export function Backdrop() {
  const { theme } = useTheme()
  return (
    <>
      {/* Shown until the first WebGL frame, and instead of it without WebGL. */}
      <div className="backdrop-still" />
      <div className="backdrop-silk">
        <GradFlow config={SILK[theme]} interactive transition={600} />
      </div>
    </>
  )
}
