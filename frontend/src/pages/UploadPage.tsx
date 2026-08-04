import {
  FileText,
  Languages,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { ProcessingSteps } from "../components/upload/ProcessingSteps";
import { VideoUploadCard } from "../components/upload/VideoUploadCard";
import { Badge } from "../components/ui/Badge";


const details = [
  {
    title: "Natural Roman Urdu",
    description:
      "Urdu script ke bajaye messaging-style Roman Urdu output.",
    icon: Languages,
  },
  {
    title: "Roman Urdu SRT",
    description:
      "Final subtitle file directly Roman Urdu mein generate hogi.",
    icon: FileText,
  },
  {
    title: "Trading vocabulary",
    description:
      "Forex, liquidity, support aur resistance jaise terms preserve hongi.",
    icon: ShieldCheck,
  },
];


export default function UploadPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-dark-gradient py-16 text-white lg:py-20">
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="page-container relative z-10">
          <Badge className="border-brand-300/20 bg-brand-300/10 text-brand-300">
            <Sparkles size={14} />
            Create Roman Urdu Subtitles
          </Badge>

          <h1 className="mt-5 max-w-4xl font-display text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">
            Upload your video and generate Roman Urdu subtitles.
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
            Final output Urdu script mein nahi hoga. Subtitle text is tarah generate hoga:
            <strong className="ml-1 text-brand-300">
              Assalam o Alaikum, and good morning.
            </strong>
          </p>
        </div>
      </section>

      <section className="page-container py-12 lg:py-16">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <VideoUploadCard />

          <aside className="space-y-4">
            {details.map((detail) => {
              const Icon = detail.icon;

              return (
                <article
                  key={detail.title}
                  className="rounded-[26px] border border-cream-300 bg-white p-6 shadow-card"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <Icon size={21} />
                  </div>

                  <h2 className="mt-5 font-display text-lg font-black text-ink-950">
                    {detail.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    {detail.description}
                  </p>
                </article>
              );
            })}
          </aside>
        </div>

        <div className="mt-14">
          <div className="mb-7">
            <p className="eyebrow">
              Processing pipeline
            </p>

            <h2 className="brand-heading mt-2 text-2xl sm:text-3xl">
              What happens after upload?
            </h2>
          </div>

          <ProcessingSteps />
        </div>
      </section>
    </>
  );
}