import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { appTitle, lessonTitle } from "@/config/lessonText";
import { team } from "@/config/team";
import { progressStore, useAnalytics, trackLoggedIn } from "@/lib/progress";
import { Play, RefreshCw, Volume2, VolumeX, Users, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تَسَلَّ وتَعَلَّمْ — في ملعب كرة السّلّة" },
      { name: "description", content: "تجربة قراءة وتقييم تفاعليّة بالعربيّة للمرحلة المتوسّطة." },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setHasSaved(progressStore.hasSavedProgress());
    const cur = progressStore.get();
    if (cur.studentName) setName(cur.studentName);
    if (cur.studentClass) setCls(cur.studentClass);
  }, []);

  const start = () => {
    if (!name.trim()) return;
    progressStore.set((p) => ({
      ...p,
      studentName: name.trim(),
      studentClass: cls.trim(),
      soundOn,
      flowStep: "instructions",
      startedAt: p.startedAt || Date.now(),
    }));
    const sid = progressStore.get().sessionId;
    trackLoggedIn(sid, name.trim(), cls.trim());
    navigate({ to: "/instructions" });
  };

  const resume = () => {
    const p = progressStore.get();
    if (p.flowStep === "reading") navigate({ to: "/reading" });
    else if (p.flowStep === "section") navigate({ to: "/section/$idx", params: { idx: String(p.currentSection) } });
    else navigate({ to: "/instructions" });
  };

  return (
    <div className="min-h-screen stadium-bg relative overflow-hidden">
      {/* Floodlight ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="flood-sweep absolute -top-20 left-1/4 w-[300px] h-[140vh] bg-gradient-to-b from-spotlight/20 to-transparent blur-3xl" />
        <div className="flood-sweep absolute -top-20 right-1/4 w-[300px] h-[140vh] bg-gradient-to-b from-spotlight/15 to-transparent blur-3xl" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-16">
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-10 md:mb-14"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold gold-text mb-4 tracking-tight">{appTitle}</h1>
          <h2 className="text-2xl md:text-4xl electric-text font-bold">{lessonTitle}</h2>
          <div className="mt-4 text-muted-foreground">{team.author}</div>
        </motion.header>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="lg:col-span-2 glass-panel rounded-3xl p-6 md:p-8"
          >
            <h3 className="text-xl font-bold mb-5 electric-text">دخول التّلميذ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-muted-foreground">اسم التّلميذ *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-input/60 border border-border text-arabic-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="مثال: سارة الحلبيّ"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-muted-foreground">الصّفّ أو الشّعبة</label>
                <input
                  value={cls}
                  onChange={(e) => setCls(e.target.value)}
                  className="w-full p-3 rounded-xl bg-input/60 border border-border text-arabic-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="مثال: الصّفّ الثّامن — شعبة أ"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-muted-foreground">وضع الصّوت</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSoundOn(true)}
                    className={`flex-1 p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                      soundOn ? "border-primary bg-primary/15" : "border-border bg-secondary/30"
                    }`}
                  >
                    <Volume2 className="w-4 h-4" /> تشغيل الصّوت
                  </button>
                  <button
                    onClick={() => setSoundOn(false)}
                    className={`flex-1 p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                      !soundOn ? "border-primary bg-primary/15" : "border-border bg-secondary/30"
                    }`}
                  >
                    <VolumeX className="w-4 h-4" /> من دون صوت
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={start}
                  disabled={!name.trim()}
                  className="px-7 py-3 rounded-2xl btn-cinematic font-bold flex items-center gap-2 disabled:opacity-50 hover:[transform:translateY(-2px)] transition"
                >
                  <Play className="w-5 h-5" /> ابدأ
                </button>
                {hasSaved && (
                  <button
                    onClick={resume}
                    className="px-6 py-3 rounded-2xl btn-gold font-bold flex items-center gap-2 hover:[transform:translateY(-2px)] transition"
                  >
                    <RefreshCw className="w-5 h-5" /> متابعة من حيث توقّفتَ
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="space-y-6"
          >
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-4 gold-text text-right">إعداد وتنفيذ - المهندسون</h3>
              <div className="space-y-3 text-right" dir="rtl">
                {team.preparedBy.map((p, i) => (
                  <div key={i} className="font-semibold text-foreground/95 text-arabic-lg">
                    {p.name}
                  </div>
                ))}
                {team.supervisor.name && (
                  <div className="pt-3 mt-2 border-t border-border text-sm">
                    <span className="text-muted-foreground">{team.supervisor.role}: </span>
                    <span className="font-semibold">{team.supervisor.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-4 electric-text">الإحصاءات</h3>
              <div className="space-y-3">
                <Stat icon={<Users className="w-4 h-4" />} label="عدد الدّاخلين إلى النّظام" value={analytics.loggedIn} />
                <Stat icon={<Trophy className="w-4 h-4" />} label="عدد الّذين أنهوا التّقييم" value={analytics.completed} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon} {label}
      </span>
      <span className="text-2xl font-bold gold-text">{value}</span>
    </div>
  );
}
