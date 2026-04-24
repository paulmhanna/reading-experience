import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/instructions")({
  head: () => ({ meta: [{ title: "ملاحظات وإرشادات" }] }),
  component: InstructionsPage,
});

const items = [
  "إنّ هذا النّتاج التّربويّ مُتَقَيِّد بالمناهج التّعليميّة المعتَمَدَة.",
  "يصلُح لأكثر من صفّ في المرحلة المتوسّطة.",
  "يجوز أنْ يكون فرديًّا، أو جماعيًّا، حرًّا، أو تحت إشراف المعلّم، في الصّفّ، أو عن بُعد.",
  "غير مُخصّص لحصّة واحدة، لأنّ الأسئلة متعدّدة ومتنوّعة بُغية الإفادة.",
  "يساعد المتعلّم على اكتساب معارف، واختبار قدرات ومهارات، واتّخاذ مواقف.",
  "يُساعد المُعلّم على تقديم تطبيقات مُتَنوَّعة إلى تلاميذه.",
  "يُمكِن الدّخول إلى السّيستام أكثر من مرّة لإنجاز المطلوب، وفي كلّ مرّة يُمكِن حفْظ ما أُنجِز.",
  "التّقييم أوتوماتيكيّ، وتظهر العلامة والإجابات الصّحيحة بعد إنجاز المطلوب.",
  "يمكن طباعة النّصّ، والإجابات، والتّقييم، ورقيًّا.",
  "التّعبير الكتابيّ، والبحث لا يشملهما التّقييم.",
];

function InstructionsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen stadium-bg">
      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← العودة</Link>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-extrabold gold-text mt-4 mb-8 text-center"
        >
          ملاحظاتٌ وإرشاداتٌ
        </motion.h1>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel rounded-2xl p-5 text-arabic-lg leading-loose"
            >
              <span className="electric-text font-bold ml-2">{i + 1}.</span> {t}
            </motion.div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate({ to: "/reading" })}
            className="px-8 py-4 rounded-2xl btn-cinematic font-bold inline-flex items-center gap-2 text-lg hover:[transform:translateY(-2px)] transition"
          >
            ابدأ القراءة <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
