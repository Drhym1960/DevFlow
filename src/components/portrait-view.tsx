import { portraitDataUri } from "@/lib/presenters/portrait";

export function PortraitView({
  presenter,
  className = "",
}: {
  presenter: {
    name: string;
    gender: string;
    skinTone: string;
    hair: string;
    clothingStyle: string;
    portraitSeed: string;
    studioStyle?: string | null;
    region?: string | null;
  };
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={portraitDataUri(presenter)} alt={presenter.name} className={`h-full w-full object-cover ${className}`} />
  );
}
