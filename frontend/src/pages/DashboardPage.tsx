import { Sparkles } from "lucide-react";

import { VideoUploadCard } from
  "../components/upload/VideoUploadCard";

import { Badge } from
  "../components/ui/Badge";


export default function DashboardPage() {
  return (
    <section className="relative overflow-hidden bg-cream-gradient">
      <div className="pointer-events-none absolute -right-32 top-10 h-[480px] w-[480px] rounded-full bg-brand-300/20 blur-3xl" />

      <div className="pointer-events-none absolute -left-32 bottom-0 h-[360px] w-[360px] rounded-full bg-brand-500/10 blur-3xl" />

      <div className="page-container relative z-10 grid min-h-[calc(100vh-82px)] items-center gap-12 py-14 lg:grid-cols-[1fr_0.92fr] lg:py-16">
        <div>
          <Badge>
            <Sparkles size={14} />
Video To Srt          </Badge>

          <h1 className="mt-6 max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-[-0.055em] text-ink-950 sm:text-5xl lg:text-[66px]">
            Convert your videos into
            <span className="block text-brand-600">
              natural Roman Urdu subtitles.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-ink-500 sm:text-lg">
            Urdu aur English mixed video upload
            karein. Tool automatically speech ko
            transcribe karke Roman Urdu subtitles
            aur downloadable SRT file generate
            karega.
          </p>
        </div>

        <div
          id="dashboard-uploader"
          className="relative scroll-mt-28"
        >
          <div className="absolute -inset-7 rounded-[46px] bg-brand-300/15 blur-2xl" />

          <div className="relative rounded-[38px] border-[16px] border-white bg-white shadow-[0_35px_90px_rgba(40,28,10,0.18)]">
            <VideoUploadCard
              variant="dark"
              className="rounded-[22px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}