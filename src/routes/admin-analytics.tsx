import { createFileRoute, Link } from "@tanstack/react-router";
import { useAnalytics } from "@/lib/progress";

export const Route = createFileRoute("/admin-analytics")({
  head: () => ({ meta: [{ title: "إدارة — الإحصاءات" }] }),
  component: AdminPage,
});

function AdminPage() {
  const a = useAnalytics();
  return (
    <div className="min-h-screen stadium-bg">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← الرّئيسيّة</Link>
        <h1 className="text-4xl font-extrabold gold-text mt-4 mb-6">لوحة الإحصاءات</h1>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Card label="عدد الدّاخلين إلى النّظام" value={a.loggedIn} />
          <Card label="عدد الّذين أنهوا التّقييم" value={a.completed} />
        </div>
        <div className="glass-panel rounded-2xl p-5 text-sm text-muted-foreground">
          {a.fallback
            ? "تعذّر الاتّصال بالخادم. الأرقام المعروضة قد تكون غير محدّثة."
            : "العدّادات مشتركة بين جميع الأجهزة."}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-panel rounded-2xl p-5 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-4xl font-extrabold gold-text mt-2">{value}</div>
    </div>
  );
}
