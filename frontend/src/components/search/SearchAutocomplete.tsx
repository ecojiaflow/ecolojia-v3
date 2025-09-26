import React, { useEffect, useRef, useState } from "react";

type Hit = { objectID: string; name?: string; brand?: string; category?: string; };

export default function SearchAutocomplete({
  query,
  onPick,
}: {
  query: string;
  onPick: (q: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const ctl = useRef<AbortController | null>(null);

  useEffect(() => {
    const appId = import.meta.env.VITE_ALGOLIA_APP_ID;
    const apiKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;
    const index = import.meta.env.VITE_ALGOLIA_INDEX || "ecolojia_products";

    if (!query || query.length < 2 || !appId || !apiKey) {
      setHits([]); setOpen(false); return;
    }

    ctl.current?.abort();
    const c = new AbortController(); ctl.current = c;

    fetch(`https://${appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(index)}/query`, {
      method: "POST",
      headers: {
        "X-Algolia-API-Key": apiKey,
        "X-Algolia-Application-Id": appId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, hitsPerPage: 5, attributesToRetrieve: ["name","brand","category"] }),
      signal: c.signal,
    })
      .then(r => r.json())
      .then(d => { setHits(d.hits || []); setOpen(true); })
      .catch(() => { setHits([]); setOpen(false); });

    return () => c.abort();
  }, [query]);

  if (!open || hits.length === 0) return null;

  return (
    <div className="absolute z-20 mt-2 w-full rounded-2xl border bg-white shadow">
      <ul className="divide-y">
        {hits.map(h => (
          <li key={h.objectID} className="p-3 hover:bg-gray-50 cursor-pointer"
              onMouseDown={(e) => { e.preventDefault(); onPick(h.name || h.brand || ""); setOpen(false); }}>
            <div className="text-sm font-medium">{h.name || "(sans nom)"}</div>
            <div className="text-xs text-gray-500">
              {h.brand ? h.brand : ""}{h.category ? ` · ${h.category}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
