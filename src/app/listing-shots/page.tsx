import Link from "next/link";

const SHOTS = [
  { file: "01-find-a-live-coach", title: "Find a Live Coach" },
  { file: "02-meet-your-advisor", title: "Meet Your Advisor" },
  { file: "03-a-gift-for-your-heart", title: "A Gift for Your Heart" },
  { file: "04-voice-call", title: "Voice Call" },
  { file: "05-heart-check", title: "Heart Check" },
  { file: "06-one-to-one-live-chat", title: "One to One Live Chat" },
];

export const metadata = {
  title: "MysticTxt App Store screenshots — DevFlow",
};

export default function ListingShotsPage() {
  return (
    <main className="min-h-screen bg-[#FDF8EE] px-6 py-12 text-[#3B2A1A]">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.32em] text-[#B69130]">DevFlow listing pack</p>
        <h1 className="mt-3 font-display text-4xl">MysticTxt App Store screenshots</h1>
        <p className="mt-4 max-w-2xl font-sans text-base leading-7 text-[#6B5420]">
          These are 1080 x 2340, RGB, no alpha. Right click an image and save it, or use Download PNG. Upload them into
          App Store Connect under 6.1" Display.
        </p>
        <p className="mt-3 font-sans text-sm text-[#6B5420]">
          <Link className="text-[#B69130]" href="/">
            Back to DevFlow
          </Link>
          {" · "}
          <Link className="text-[#B69130]" href="/store-shots">
            Make more in Store Screenshots
          </Link>
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SHOTS.map((shot) => {
            const png = `/store-shots/1080x2340/${shot.file}.png`;
            const jpg = `/store-shots/1080x2340/${shot.file}.jpg`;
            return (
              <figure key={shot.file} className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_40px_rgba(59,42,26,0.08)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={jpg} alt={shot.title} width={1080} height={2340} className="w-full bg-[#F4EAD8]" />
                <figcaption className="space-y-2 p-4 font-sans">
                  <p className="font-display text-lg">{shot.title}</p>
                  <p className="text-sm text-[#6B5420]">1080 × 2340</p>
                  <p className="flex gap-4 text-sm">
                    <a className="font-semibold text-[#B69130]" href={png} download>
                      Download PNG
                    </a>
                    <a className="font-semibold text-[#B69130]" href={jpg} download>
                      Download JPEG
                    </a>
                  </p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </main>
  );
}
