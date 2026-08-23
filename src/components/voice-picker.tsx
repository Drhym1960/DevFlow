"use client";

import { STUDIO_VOICES, voicesForGender, type StudioVoice } from "@/lib/ai/providers/tts/voices";
import { Select } from "./ui";

export function VoicePicker({
  value,
  onChange,
  gender,
  allowAny = true,
  label = "Voice for this film",
}: {
  value: string;
  onChange: (id: string) => void;
  gender?: string;
  allowAny?: boolean;
  label?: string;
}) {
  const matching = voicesForGender(gender);
  const extras = allowAny ? STUDIO_VOICES.filter((v) => !matching.includes(v)) : [];
  const groups: { heading: string; voices: StudioVoice[] }[] = [
    { heading: gender === "male" ? "Male voices" : gender === "female" ? "Female voices" : "Studio voices", voices: matching },
  ];
  if (extras.length) groups.push({ heading: "Other voices", voices: extras });

  return (
    <Select label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {groups.map((group) => (
        <optgroup key={group.heading} label={group.heading}>
          {group.voices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} — {v.description}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}
