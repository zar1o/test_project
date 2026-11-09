// "Jade Night": the dark-theme counterpart of Jade Sky. Same recipe and the
// same four light sources at the same coordinates, re-lit for a dark canvas,
// so switching themes keeps the composition and changes only the light.

export function GradientBackgroundNight({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        containerType: "size",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-0.8cqmin",
          filter: "blur(0.4cqmin)",
          backgroundColor: "#081311",
          backgroundImage:
            "radial-gradient(circle at 65.34% 44.62%, rgba(58, 84, 66, 0.55) 0%, rgba(58, 84, 66, 0) 34.1%), radial-gradient(circle at 28.07% 74.48%, rgba(64, 98, 40, 0.55) 0%, rgba(64, 98, 40, 0) 45.65%), radial-gradient(circle at 52.42% 19.94%, rgba(31, 110, 82, 0.85) 0%, rgba(31, 110, 82, 0) 57.55%), radial-gradient(circle at 80.31% 84.47%, rgba(20, 70, 84, 0.8) 0%, rgba(20, 70, 84, 0) 69.1%)",
        }}
      />
    </div>
  )
}
