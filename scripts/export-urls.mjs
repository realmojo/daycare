#!/usr/bin/env node
/**
 * 전체 URL 을 naver-indexing/urls.txt 로 뽑는다.
 *
 *   npm run export:urls
 *   npm run export:urls -- --all     색인 대상이 아닌 것까지 (확인용)
 *
 * 네이버 서치어드바이저는 사이트맵과 별개로 URL 목록 제출을 받는다.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  사이트맵과 같은 기준을 쓴다
 * ────────────────────────────────────────────────────────────────────────
 * **값이 있는 것만 넣는다.** 지역은 median_per_staff, 어린이집은 운영현황이
 * 정상이고 per_staff 가 있어야 한다. 화면에서 noindex 로 막아 둔 주소를
 * 제출하면 앞뒤가 안 맞고, 빈 페이지를 잔뜩 내밀면 사이트 전체 평가가 깎인다.
 *
 * 인코딩 규칙은 lib/seo.ts 의 absoluteUrl 과 같아야 한다 — 한 조각씩
 * encodeURIComponent 를 걸고 슬래시로 다시 잇는다.
 *
 * 뽑은 뒤 사이트맵 개수와 대조해 볼 것. 어긋나면 한쪽 판정이 다른 것이다.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
dotenv.config({ path: path.join(ROOT, ".env.local"), quiet: true });

const ALL = process.argv.slice(2).includes("--all");

const SITE = "https://daycare.keywordegg.com";
const abs = (p) =>
  !p || p === "/"
    ? SITE
    : `${SITE}${(p.startsWith("/") ? p : `/${p}`)
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`;

const STATIC = ["/", "/지역", "/about", "/contact", "/privacy", "/terms"];

/** lib/center.ts 의 centerSlug 와 **같은 규칙**이어야 한다 */
function slugifyName(name) {
  return (
    String(name ?? "")
      .toLowerCase()
      .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50)
      .replace(/-+$/g, "") || "어린이집"
  );
}
const centerSlug = (name, id) => `${slugifyName(name)}-${id}`;

/** Supabase 는 한 번에 1000행까지만 준다. 나눠 받지 않으면 조용히 잘린다. */
async function pageAll(build) {
  const out = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
  }
  return out;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(".env.local 의 Supabase 설정을 확인하세요.");
    process.exit(1);
  }
  const sb = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const regions = await pageAll(() => {
    let q = sb.from("daycare_regions").select("region_slug").order("region_slug");
    if (!ALL) q = q.not("median_per_staff", "is", null);
    return q;
  });

  const centers = await pageAll(() => {
    let q = sb
      .from("daycare_centers")
      .select("center_id, name, region_slug")
      .order("center_id");
    if (!ALL) q = q.eq("status", "정상").not("per_staff", "is", null);
    return q;
  });

  const urls = [
    ...STATIC.map(abs),
    ...regions.map((r) => abs(`/${r.region_slug}`)),
    ...centers.map((c) =>
      abs(`/${c.region_slug}/${centerSlug(c.name, c.center_id)}`),
    ),
  ];

  const uniq = [...new Set(urls)];
  const out = path.join(ROOT, "naver-indexing/urls.txt");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${uniq.join("\n")}\n`, "utf8");

  console.log(
    `고정 ${STATIC.length} · 지역 ${regions.length} · 어린이집 ${centers.length}`,
  );
  const dropped = urls.length - uniq.length;
  if (dropped) console.log(`  중복 ${dropped}건 제거`);
  console.log(`합계 ${uniq.length}${ALL ? " (--all: 색인 대상 아닌 것 포함)" : ""}`);
  console.log(out);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
