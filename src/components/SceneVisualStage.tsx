import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  chunkId: number;
}

/**
 * SceneVisualStage — cinematic per-chunk stage.
 * No emojis, no childish elements. Pure SVG + CSS layered scenes.
 */
export function SceneVisualStage({ chunkId }: Props) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl glass-panel">
      <AnimatePresence mode="wait">
        <motion.div
          key={chunkId}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-0"
        >
          {chunkId === 1 && <Scene1 />}
          {chunkId === 2 && <Scene2 />}
          {chunkId === 3 && <Scene3 />}
          {chunkId === 4 && <Scene4 />}
          {chunkId === 5 && <Scene5 />}
          {chunkId === 6 && <Scene6 />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Shared backdrop: stadium night sky + stands
function StadiumBackdrop({ intensity = 1 }: { intensity?: number }) {
  return (
    <svg
      viewBox="0 0 800 450"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.18 0.07 260)" />
          <stop offset="60%" stopColor="oklch(0.10 0.04 260)" />
          <stop offset="100%" stopColor="oklch(0.05 0.02 260)" />
        </linearGradient>
        <radialGradient id="halo" cx="50%" cy="20%" r="60%">
          <stop offset="0%" stopColor={`oklch(0.85 0.15 90 / ${0.45 * intensity})`} />
          <stop offset="100%" stopColor="oklch(0.85 0.15 90 / 0)" />
        </radialGradient>
        <linearGradient id="court" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.45 0.16 50)" />
          <stop offset="100%" stopColor="oklch(0.30 0.12 45)" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#sky)" />
      <rect width="800" height="450" fill="url(#halo)" />
      {/* Stadium roof arc */}
      <path
        d="M -20 110 Q 400 -40 820 110 L 820 0 L -20 0 Z"
        fill="oklch(0.08 0.03 260)"
        opacity="0.85"
      />
      {/* Stands */}
      <g>
        {Array.from({ length: 18 }).map((_, i) => {
          const x = i * 45;
          return (
            <rect
              key={i}
              x={x}
              y={140}
              width="40"
              height="120"
              rx="2"
              fill={`oklch(${0.20 + (i % 3) * 0.04} 0.06 ${250 + (i % 5) * 4})`}
              opacity="0.85"
              className="crowd-pulse"
              style={{ animationDelay: `${(i * 0.13) % 1.6}s`, transformOrigin: `${x + 20}px 260px` }}
            />
          );
        })}
      </g>
      {/* Court */}
      <ellipse cx="400" cy="370" rx="380" ry="70" fill="url(#court)" opacity="0.95" />
      <ellipse cx="400" cy="370" rx="380" ry="70" fill="none" stroke="oklch(0.95 0.05 90 / 0.3)" />
      <line
        x1="400"
        y1="305"
        x2="400"
        y2="440"
        stroke="oklch(0.95 0.05 90 / 0.35)"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <circle cx="400" cy="370" r="60" fill="none" stroke="oklch(0.95 0.05 90 / 0.35)" />
    </svg>
  );
}

function Floodlights({ active = true }: { active?: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[10, 50, 90].map((x, i) => (
        <div
          key={i}
          className={active ? "flood-sweep" : ""}
          style={{
            position: "absolute",
            top: "-10%",
            left: `${x}%`,
            width: "200px",
            height: "120%",
            background:
              "linear-gradient(180deg, oklch(0.97 0.07 95 / 0.18), transparent)",
            transform: "translateX(-50%)",
            filter: "blur(20px)",
            animationDelay: `${i * 1.3}s`,
          }}
        />
      ))}
    </div>
  );
}

function Scene1() {
  return (
    <>
      <StadiumBackdrop intensity={0.7} />
      <Floodlights active />
      {/* Narrator silhouette running */}
      <motion.div
        initial={{ x: -120, opacity: 0 }}
        animate={{ x: 50, opacity: 1 }}
        transition={{ duration: 4, ease: "easeOut" }}
        className="absolute bottom-[26%] left-0"
      >
        <svg width="50" height="80" viewBox="0 0 50 80">
          <circle cx="25" cy="14" r="9" fill="oklch(0.7 0.05 260)" />
          <path d="M25 22 L25 50 L18 70 M25 50 L34 70 M14 32 L36 32" stroke="oklch(0.6 0.1 250)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </motion.div>
      {/* Caption */}
      <SceneCaption text="الوصول إلى الملعب — الترقّب يبدأ" />
    </>
  );
}

function Scene2() {
  return (
    <>
      <StadiumBackdrop intensity={1} />
      <Floodlights active />
      {/* Players entering */}
      <motion.div
        initial={{ x: -200 }}
        animate={{ x: 100 }}
        transition={{ duration: 5, ease: "easeOut" }}
        className="absolute bottom-[22%] right-[30%] flex gap-4"
      >
        {[0, 1, 2, 3].map((i) => (
          <PlayerSilhouette key={i} color="oklch(0.7 0.18 250)" delay={i * 0.2} />
        ))}
      </motion.div>
      {/* Flags */}
      <div className="absolute top-[28%] left-0 right-0 flex justify-around">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="flag-wave"
            style={{
              animationDelay: `${(i * 0.18) % 2}s`,
              width: 30,
              height: 22,
              background:
                i % 2
                  ? "linear-gradient(135deg, oklch(0.83 0.16 85), oklch(0.7 0.2 70))"
                  : "linear-gradient(135deg, oklch(0.7 0.18 250), oklch(0.55 0.22 255))",
              borderRadius: 3,
              boxShadow: "0 0 12px oklch(0.7 0.18 250 / 0.5)",
            }}
          />
        ))}
      </div>
      <SceneCaption text="دخول اللاعبين — الجماهير كسهول القمح المتماوجة" />
    </>
  );
}

function Scene3() {
  return (
    <>
      <StadiumBackdrop intensity={0.9} />
      <Floodlights active />
      {/* Whistle pulse */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.4, 1], opacity: [0, 1, 0.7] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute top-[20%] left-1/2 -translate-x-1/2 text-accent gold-text text-2xl font-bold"
      >
        ▎صفّارة البداية ▎
      </motion.div>
      {/* Ball motion arc */}
      <motion.div
        animate={{
          x: [-150, 150, -150],
          y: [0, -80, 0],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[35%] left-1/2"
      >
        <BasketballSVG />
      </motion.div>
      {/* Players running */}
      <div className="absolute bottom-[22%] left-0 right-0 flex justify-between px-12">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={{ x: [0, 30, 0, -30, 0] }}
            transition={{ duration: 3 + i * 0.3, repeat: Infinity }}
          >
            <PlayerSilhouette color={i % 2 ? "oklch(0.7 0.18 250)" : "oklch(0.65 0.22 25)"} delay={i * 0.1} />
          </motion.div>
        ))}
      </div>
      <SceneCaption text="الكرّ والفرّ — حركة بلا تعب" />
    </>
  );
}

function Scene4() {
  return (
    <>
      <StadiumBackdrop intensity={1} />
      <Floodlights active />
      {/* Scoreboard */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl scoreboard-flash glass-panel flex items-center gap-6 text-2xl font-bold"
      >
        <span className="electric-text">فريقنا 24</span>
        <span className="text-muted-foreground">|</span>
        <span className="gold-text">المنافس 22</span>
      </motion.div>
      {/* Ball in arc */}
      <motion.div
        animate={{ x: [0, 200, 0], y: [0, -120, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[40%] left-[30%]"
      >
        <BasketballSVG />
      </motion.div>
      {/* Tension dots */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
            className="w-3 h-3 rounded-full bg-accent"
          />
        ))}
      </div>
      <SceneCaption text="القلوب تخفق — الأعناق تشرئبّ" />
    </>
  );
}

function Scene5() {
  return (
    <>
      <StadiumBackdrop intensity={1.2} />
      <Floodlights active />
      {/* Player dash */}
      <motion.div
        initial={{ x: -300, scale: 0.9 }}
        animate={{ x: 200, scale: 1.1 }}
        transition={{ duration: 1.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="absolute bottom-[24%] left-0"
      >
        <PlayerSilhouette color="oklch(0.7 0.18 250)" delay={0} large />
      </motion.div>
      {/* Slow-mo basket */}
      <motion.div
        initial={{ x: 0, y: 0 }}
        animate={{ x: 250, y: -180, scale: 1.2 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute bottom-[35%] left-[40%]"
      >
        <BasketballSVG large />
      </motion.div>
      {/* Explosion of light */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.5], opacity: [0, 0.8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1 }}
        className="absolute top-[25%] right-[20%] w-40 h-40 rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.92 0.18 90 / 0.9), transparent 70%)",
        }}
      />
      <SceneCaption text="الفوز! تعالت الأيادي وتمزّقت أرجاء الملعب بالصّرخات" />
    </>
  );
}

function Scene6() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      <StadiumBackdrop intensity={1} />
      <Floodlights active />
      {/* Trophy */}
      <motion.div
        initial={{ y: 200, opacity: 0, scale: 0.6 }}
        animate={{ y: -40, opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: [0.2, 0.8, 0.2, 1] }}
        className="absolute bottom-[28%] left-1/2 -translate-x-1/2"
      >
        <div className="trophy-glow">
          <TrophySVG />
        </div>
      </motion.div>
      {/* Confetti */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${(i * 37) % 100}%`,
                width: 6,
                height: 12,
                background:
                  i % 3 === 0
                    ? "oklch(0.83 0.16 85)"
                    : i % 3 === 1
                    ? "oklch(0.7 0.18 250)"
                    : "oklch(0.97 0.05 95)",
                animation: `confettiFall ${4 + (i % 5)}s linear ${(i % 6) * 0.4}s infinite`,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      )}
      <SceneCaption text="رفع الكأس — لهيبٌ من التّصفيقِ والافتخار" />
    </>
  );
}

function PlayerSilhouette({
  color,
  delay,
  large,
}: {
  color: string;
  delay: number;
  large?: boolean;
}) {
  const s = large ? 1.4 : 1;
  return (
    <svg
      width={50 * s}
      height={80 * s}
      viewBox="0 0 50 80"
      style={{ animationDelay: `${delay}s` }}
    >
      <circle cx="25" cy="14" r="9" fill={color} />
      <path
        d="M25 22 L25 50 L18 72 M25 50 L34 72 M12 32 L38 32"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BasketballSVG({ large }: { large?: boolean }) {
  const r = large ? 22 : 14;
  return (
    <svg width={r * 2} height={r * 2}>
      <defs>
        <radialGradient id="ballg" cx="35%" cy="35%">
          <stop offset="0%" stopColor="oklch(0.85 0.18 60)" />
          <stop offset="100%" stopColor="oklch(0.55 0.22 50)" />
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r - 1} fill="url(#ballg)" />
      <path
        d={`M0 ${r} Q${r} ${r - 6} ${r * 2} ${r}`}
        stroke="oklch(0.18 0.06 50)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d={`M${r} 0 Q${r - 6} ${r} ${r} ${r * 2}`}
        stroke="oklch(0.18 0.06 50)"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function TrophySVG() {
  return (
    <svg width="100" height="140" viewBox="0 0 100 140">
      <defs>
        <linearGradient id="goldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.95 0.16 90)" />
          <stop offset="100%" stopColor="oklch(0.65 0.2 70)" />
        </linearGradient>
      </defs>
      <path
        d="M30 10 H70 V40 Q70 70 50 70 Q30 70 30 40 Z"
        fill="url(#goldg)"
        stroke="oklch(0.4 0.15 65)"
        strokeWidth="1.5"
      />
      <path
        d="M20 18 Q5 18 5 35 Q5 55 30 55"
        fill="none"
        stroke="oklch(0.85 0.15 85)"
        strokeWidth="4"
      />
      <path
        d="M80 18 Q95 18 95 35 Q95 55 70 55"
        fill="none"
        stroke="oklch(0.85 0.15 85)"
        strokeWidth="4"
      />
      <rect x="42" y="70" width="16" height="22" fill="url(#goldg)" />
      <rect x="28" y="92" width="44" height="10" rx="2" fill="url(#goldg)" />
      <rect x="22" y="102" width="56" height="14" rx="3" fill="url(#goldg)" />
    </svg>
  );
}

function SceneCaption({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.7 }}
      className="absolute bottom-3 left-3 right-3 text-center"
    >
      <span className="inline-block px-4 py-2 rounded-full glass-panel text-sm md:text-base text-foreground/90 font-medium">
        {text}
      </span>
    </motion.div>
  );
}
