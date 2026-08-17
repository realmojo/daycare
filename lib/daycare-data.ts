/**
 * 어린이집 조회.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  원본
 * ────────────────────────────────────────────────────────────────────────
 * 한국사회보장정보원이 공개하는 전국 어린이집 정보. 공공데이터포털에 여러
 * 갈래로 열려 있고 전부 자동승인이다.
 *
 *   15013108  전국어린이집표준데이터        (표준데이터 — 한 번에 전량)
 *   15101155  전국 어린이집 정보 조회
 *   15101154  어린이집별 기본정보 조회
 *   3065251   어린이집 정보
 *
 * ────────────────────────────────────────────────────────────────────────
 *  이 사이트가 무엇으로 견주는가
 * ────────────────────────────────────────────────────────────────────────
 * 원본에 **정원수·현원수·보육교직원수**가 있다. 여기서 학부모가 실제로 궁금해
 * 하는 두 숫자가 나온다.
 *
 *   교사 1인당 아동 수 = 현원 ÷ 보육교직원수
 *   충원율             = 현원 ÷ 정원
 *
 * **교사 1인당 아동 수가 이 사이트의 주축이다.** 어디서도 나란히 놓고 보여주지
 * 않는데 어린이집을 고르는 가장 실질적인 기준이다. medifee 의 ㎡당, apt 의
 * ㎡당과 같은 역할을 한다.
 *
 * 다만 **보육교직원수에는 원장·조리원·사무원이 함께 들어간다.** 담임교사만 센
 * 값이 아니므로 법정 교사 대 아동 비율과 그대로 견주면 안 된다. 화면에서
 * 반드시 밝힌다 — 이걸 빼먹으면 "법을 어겼다" 는 잘못된 결론으로 간다.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  적재 경로
 * ────────────────────────────────────────────────────────────────────────
 * 오픈API 는 활용신청이 걸려 있어서, 정보공개포털에서 시도별로 내려받은 xls 를
 * scripts/import-centers.mjs 가 읽어 넣는다. 정기 갱신 자료라 자주 돌릴 이유도
 * 없다. 자료 기준일은 base_date 에 그대로 남긴다.
 */

import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

export const CENTERS_TABLE = "daycare_centers";
export const REGIONS_TABLE = "daycare_regions";

const CACHE_SECONDS = 3600;
/** 조회 결과의 모양이 바뀌면 반드시 올린다 */
const CACHE_VERSION = "v0";

/** 어린이집 하나 */
export interface Center {
  /** 표준 어린이집 코드. URL 슬러그의 꼬리로 쓴다 */
  center_id: string;
  name: string;
  region_slug: string;
  sido: string;
  sigungu: string;
  /** 국공립 · 민간 · 가정 · 사회복지법인 … */
  kind: string | null;
  /** 운영현황 (정상 / 휴지 / 폐지) */
  status: string | null;
  address: string | null;
  tel: string | null;
  /** 정원 */
  capacity: number | null;
  /** 현원 */
  enrolled: number | null;
  /** 보육교직원수 — 원장·조리원 등이 함께 들어간 값이다 */
  staff: number | null;
  /** 보육실 수 */
  rooms: number | null;
  /** 놀이터 수 */
  playgrounds: number | null;
  /** CCTV 설치 수 */
  cctv: number | null;
  /** 통학차량 운영 여부 */
  bus: boolean | null;
  /** 보육실 면적 합계 (㎡) */
  room_area: number | null;
  homepage: string | null;
  /** 인가일자 */
  approved_at: string | null;
  lat: number | null;
  lng: number | null;
  /**
   * 아동 ÷ 보육교직원. **적재 시 계산해 넣는다.**
   * 화면에서 다시 계산하지 않는다 — 조건이 두 곳으로 갈라지면 어긋난다.
   */
  per_staff: number | null;
  /** 현원 ÷ 정원 */
  fill_rate: number | null;
  /** 자료 기준일 YYYYMMDD */
  base_date: string | null;
}

export interface RegionStats {
  region_slug: string;
  sido: string;
  sigungu: string;
  center_count: number;
  /** per_staff 를 낼 수 있는 곳의 수 */
  rated_count: number;
  /** 지역 교사 1인당 아동 수 중간값 */
  median_per_staff: number | null;
  /** 지역 전체 정원·현원 */
  capacity_sum: number | null;
  enrolled_sum: number | null;
  updated_at: string;
}

/**
 * 이 지역을 공개해도 되는가.
 *
 * 시설이 있다는 것과 보여줄 값이 있다는 것은 다르다. 이 판정을 화면·사이트맵·
 * 메타데이터가 **모두 같이** 써야 한다. 한 곳만 다르면 빈 페이지가 색인된다.
 */
export function isPublishable(
  stats: RegionStats | null | undefined,
): stats is RegionStats {
  return Boolean(stats && stats.median_per_staff !== null);
}

/* ------------------------------- 조회 ------------------------------- */

async function fetchRegionStats(): Promise<RegionStats[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from(REGIONS_TABLE)
      .select("*")
      .limit(1000);
    // 테이블을 아직 만들지 않았을 수 있다. 화면은 "준비 중" 으로 그린다.
    if (error) return [];
    return (data ?? []) as RegionStats[];
  } catch {
    return [];
  }
}

const CENTER_COLUMNS =
  "center_id, name, region_slug, sido, sigungu, kind, status, address, tel, homepage, rooms, room_area, playgrounds, cctv, staff, capacity, enrolled, bus, approved_at, lat, lng, per_staff, fill_rate, base_date";

/** 어린이집 하나. 조회는 슬러그가 아니라 center_id 로 한다 (lib/center.ts) */
async function fetchCenter(centerId: string): Promise<Center | null> {
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from(CENTERS_TABLE)
      .select(CENTER_COLUMNS)
      .eq("center_id", centerId)
      .maybeSingle();
    if (error) return null;
    return (data as unknown as Center) ?? null;
  } catch {
    return null;
  }
}

/**
 * 한 지역의 어린이집.
 *
 * 가장 많은 곳이 690곳(경기 화성시)이라 Supabase 의 1000행 상한 안에 든다.
 * 상한에 닿으면 잘린 줄도 모르고 지나가므로 여기 숫자를 손볼 때 주의할 것.
 */
async function fetchRegionCenters(regionSlug: string): Promise<Center[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from(CENTERS_TABLE)
      .select(CENTER_COLUMNS)
      .eq("region_slug", regionSlug)
      .order("name")
      .limit(1000);
    if (error) return [];
    return (data ?? []) as unknown as Center[];
  } catch {
    return [];
  }
}

/** 사이트맵에 넣을 어린이집 — 운영 중이고 지표가 있는 곳만 */
async function fetchPublishedCenters(): Promise<
  Array<{ center_id: string; name: string; region_slug: string }>
> {
  if (!supabaseAdmin) return [];
  const out: Array<{ center_id: string; name: string; region_slug: string }> = [];
  try {
    // 1000행씩 나눠 받는다. 한 번에 달라고 하면 조용히 잘린다.
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabaseAdmin
        .from(CENTERS_TABLE)
        .select("center_id, name, region_slug")
        .eq("status", "정상")
        .not("per_staff", "is", null)
        .order("center_id")
        .range(from, from + PAGE - 1);
      if (error || !data || data.length === 0) break;
      out.push(...data);
      if (data.length < PAGE) break;
    }
    return out;
  } catch {
    return out;
  }
}

const cachedRegionStats = unstable_cache(
  fetchRegionStats,
  [CACHE_VERSION, "region-stats"],
  { revalidate: CACHE_SECONDS, tags: ["daycare"] },
);
const cachedCenter = unstable_cache(fetchCenter, [CACHE_VERSION, "center"], {
  revalidate: CACHE_SECONDS,
  tags: ["daycare"],
});
const cachedRegionCenters = unstable_cache(
  fetchRegionCenters,
  [CACHE_VERSION, "region-centers"],
  { revalidate: CACHE_SECONDS, tags: ["daycare"] },
);
const cachedPublishedCenters = unstable_cache(
  fetchPublishedCenters,
  [CACHE_VERSION, "published-centers"],
  { revalidate: CACHE_SECONDS, tags: ["daycare"] },
);

export function getCenter(centerId: string) {
  return cachedCenter(centerId);
}
export function listRegionCenters(regionSlug: string) {
  return cachedRegionCenters(regionSlug);
}
export function listPublishedCenters() {
  return cachedPublishedCenters();
}

export async function getAllRegionStats(): Promise<Map<string, RegionStats>> {
  const rows = await cachedRegionStats();
  return new Map(rows.map((r) => [r.region_slug, r]));
}

/* ----------------------------- 화면용 계산 ----------------------------- */

/** "12.3명" — 소수 한 자리까지. 사람 수라 반올림하면 차이가 뭉개진다. */
export function formatPerStaff(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${(Math.round(value * 10) / 10).toLocaleString("ko-KR")}명`;
}

/** "84%" */
export function formatRate(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
): string {
  if (!numerator || !denominator) return "-";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

/**
 * 앞말의 받침에 맞는 조사를 골라 붙인다.
 * 어린이집 이름이 그대로 문장에 들어가므로 "은(는)" 표기를 쓰지 않는다.
 */
export function withParticle(word: string, pair: "은는" | "이가"): string {
  const bare = word
    .trim()
    .replace(/\s*[([{][^)\]}]*[)\]}]\s*$/, "")
    .replace(/[\s.,·]+$/, "")
    .trim();
  const last = (bare || word.trim()).slice(-1);
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const hasJong = (code - 0xac00) % 28 !== 0;
    if (pair === "은는") return `${word}${hasJong ? "은" : "는"}`;
    return `${word}${hasJong ? "이" : "가"}`;
  }
  return pair === "은는" ? `${word}은(는)` : `${word}이(가)`;
}
