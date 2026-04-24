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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card label="إجمالي الجلسات" value={a.totalSessions} />
          <Card label="بدأوا القراءة" value={a.totalReadingStarted} />
          <Card label="أنهوا التّقييم" value={a.totalAssessmentsCompleted} />
          <Card label="تنزيلات PDF" value={a.totalPdfDownloads} />
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-4 electric-text">آخر النّشاطات</h2>
          <div className="space-y-2">
            {a.recent.length === 0 && <div className="text-muted-foreground text-sm">لا يوجد نشاط بعد.</div>}
            {a.recent.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-border pb-2">
                <span className="font-semibold">{r.name || "مجهول"} {r.cls && `— ${r.cls}`}</span>
                <span className="text-accent">{r.event}</span>
                <span className="text-muted-foreground">{new Date(r.at).toLocaleString("ar")}</span>
              </div>
            ))}
          </div>
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
