export default function Footer() {
  return (
    <footer>
      <div className="max-w-[1080px] mx-auto px-6" style={{ borderTop: '1px solid hsl(220 10% 14%)' }}>
        <div className="flex justify-between items-center py-5" style={{ paddingTop: 32, paddingBottom: 20 }}>
          <span className="font-syne font-medium text-[13px] text-text-muted">ArthSaathi (अर्थसाथी)</span>
          <span className="font-syne text-[13px] text-text-muted">Built at ET AI Hackathon · 2026</span>
        </div>

        <div className="pb-8">
          <div className="rounded-md px-4 py-2.5 text-left" style={{ background: 'hsl(220 20% 10%)', border: '1px solid hsl(220 10% 14%)' }}>
            <p className="font-syne text-xs text-text-muted leading-relaxed">
              Mutual fund investments are subject to market risk. This tool provides analysis for informational purposes only and does not constitute investment advice. Past performance is not indicative of future returns.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
