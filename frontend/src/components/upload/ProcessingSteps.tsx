import {
  AudioLines,
  Captions,
  FileVideo2,
  Languages,
  ScanText,
} from "lucide-react";

const steps = [
  {
    title: "Upload Video",
    description: "MP4, MOV, MKV or WebM",
    icon: FileVideo2,
  },
  {
    title: "Extract Audio",
    description: "Clean and normalize speech",
    icon: AudioLines,
  },
  {
    title: "Transcribe",
    description: "Accurate Urdu and English",
    icon: ScanText,
  },
  {
    title: "Roman Urdu",
    description: "Murshid writing style",
    icon: Languages,
  },
  {
    title: "Export",
    description: "SRT, VTT, TXT and MP4",
    icon: Captions,
  },
];

export function ProcessingSteps() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {steps.map((step, index) => {
        const Icon = step.icon;

        return (
          <div
            key={step.title}
            className="relative rounded-2xl border border-cream-300 bg-white p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <Icon size={19} />
              </div>

              <span className="text-xs font-black text-ink-300">
                0{index + 1}
              </span>
            </div>

            <h3 className="text-sm font-extrabold text-ink-900">
              {step.title}
            </h3>

            <p className="mt-1 text-xs leading-5 text-ink-400">
              {step.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}