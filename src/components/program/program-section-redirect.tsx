"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  legacyProgramSectionHref,
  programSectionHref,
  type ProgramSection,
} from "@/lib/program-sections";

export function ProgramSectionRedirect({
  section,
}: {
  section: ProgramSection;
}) {
  const router = useRouter();
  useEffect(() => {
    router.replace(
      legacyProgramSectionHref(
        section,
        window.location.search,
        window.location.hash,
      ),
    );
  }, [router, section]);
  return (
    <p role="status">
      Opening Program…{" "}
      <Link href={programSectionHref(section)}>Continue to Program</Link>
    </p>
  );
}
