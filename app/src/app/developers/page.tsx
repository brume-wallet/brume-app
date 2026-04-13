import { BRUME_GITHUB_REPO_URL } from "@brume/shared";
import Link from "next/link";

export const metadata = {
  title: "Developers",
  description: "Brume API routes for the wallet extension.",
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-brume-void px-4 py-12 text-on-surface sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm font-medium text-secondary transition-colors hover:text-primary"
        >
          ← Back to home
        </Link>
        <h1 className="mt-8 font-display text-3xl italic text-white">
          Brume API
        </h1>
        <p className="mt-3 text-on-surface-variant">
          Indexer and token metadata for the{" "}
          <a
            href={BRUME_GITHUB_REPO_URL}
            className="text-secondary underline-offset-2 transition-colors hover:text-primary hover:underline"
          >
            Brume
          </a>{" "}
          wallet extension.
        </p>
        <ul className="mt-8 space-y-3 font-mono text-on-surface-variant">
          <li className="min-w-0">
            <code className="block w-full max-w-full overflow-x-auto rounded border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-[11px] leading-snug text-on-surface [-webkit-overflow-scrolling:touch] sm:text-sm">
              GET /api/health
            </code>
          </li>
          <li className="min-w-0">
            <code className="block w-full max-w-full overflow-x-auto rounded border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-[11px] leading-snug text-on-surface [-webkit-overflow-scrolling:touch] sm:text-sm">
              GET /api/tokens/portfolio?owner=&amp;network=
            </code>
          </li>
          <li className="min-w-0">
            <code className="block w-full max-w-full overflow-x-auto rounded border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-[11px] leading-snug text-on-surface [-webkit-overflow-scrolling:touch] sm:text-sm">
              GET /api/tokens/metadata/&lt;mint&gt;?network=
            </code>
          </li>
          <li className="min-w-0">
            <code className="block w-full max-w-full overflow-x-auto rounded border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-[11px] leading-snug text-on-surface [-webkit-overflow-scrolling:touch] sm:text-sm">
              GET /api/activity/&lt;address&gt;?network=&amp;limit=
            </code>
          </li>
        </ul>
      </div>
    </div>
  );
}
