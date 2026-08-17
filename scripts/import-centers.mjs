#!/usr/bin/env node
/**
 * 전국 어린이집을 Supabase 에 적재한다.
 *
 *   npm run import:centers -- --dir ~/Downloads
 *   npm run import:centers -- --dir ~/Downloads --dry-run
 *
 * ────────────────────────────────────────────────────────────────────────
 *  왜 파일인가
 * ────────────────────────────────────────────────────────────────────────
 * 오픈API(아이사랑 cpmsapi030 등)가 있지만 활용신청이 걸려 있다. 그래서
 * 어린이집 정보공개포털에서 **시도별로 내려받은 xls** 를 쓴다. 조사가 정기
 * 갱신이라 자주 돌릴 이유도 없다.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  원본에서 걸린 것 셋
 * ────────────────────────────────────────────────────────────────────────
 * 1. **같은 파일이 여러 번 받아진다.** 파일명에 (1)(2)… 가 붙어 내려오는데
 *    충북·경남·인천·세종이 두 번씩 있었다(4,170행 중복). 행 전체를 키로 잡아
 *    걸러낸다.
 *
 * 2. **시도가 합쳐져 온다.** `전남광주통합특별시` 하나에 광주와 전남이 같이
 *    들어 있고 `광주광역시`·`전라남도` 표기는 아예 없다. 시군구 이름으로
 *    가른다 — 전남에는 동/서/남/북/광산구가 없어서 겹치지 않는다.
 *    (apt 에서 K-apt 도 똑같았다)
 *
 * 3. **일반구가 섞여 온다.** `부천시오정구` 처럼. data/regions.json 은 시
 *    단위이므로 시로 올린다.
 *
 * 셋 다 조용히 어긋나는 종류라, 못 알아본 값은 경고로 찍고 넘어가지 않는다.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import * as XLSX from "xlsx";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
dotenv.config({ path: path.join(ROOT, ".env.local"), quiet: true });

const args = process.argv.slice(2);
const opt = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const DRY = args.includes("--dry-run");
const DIR = opt("--dir", path.join(process.env.HOME ?? "", "Downloads"));

/** 원본 헤더. 순서가 바뀌면 알아채야 하므로 그대로 적어 둔다. */
const HEADERS = [
  "시도", "시군구", "어린이집명", "어린이집유형구분", "운영현황", "우편번호",
  "주소", "어린이집전화번호", "어린이집팩스번호", "보육실수", "보육실면적",
  "놀이터수", "CCTV설치수", "보육교직원수", "정원수", "현원수", "위도", "경도",
  "통학차량운영여부", "홈페이지주소", "인가일자", "휴지시작일자", "휴지종료일자",
];

const SIDO_SHORT = {
  서울특별시: "서울", 부산광역시: "부산", 대구광역시: "대구", 인천광역시: "인천",
  광주광역시: "광주", 대전광역시: "대전", 울산광역시: "울산", 세종특별자치시: "세종",
  경기도: "경기", 강원특별자치도: "강원", 강원도: "강원", 충청북도: "충북",
  충청남도: "충남", 전북특별자치도: "전북", 전라북도: "전북", 전라남도: "전남",
  경상북도: "경북", 경상남도: "경남", 제주특별자치도: "제주",
};

/** 전남·광주를 합쳐 놓은 표기. 시군구 이름으로 가른다. */
const MERGED_SIDO = "전남광주통합특별시";
const GWANGJU_GU = new Set(["동구", "서구", "남구", "북구", "광산구"]);

const REGION_DATA = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "regions.json"), "utf8"),
);
const KNOWN = Object.fromEntries(
  Object.entries(REGION_DATA.sigungu).map(([s, l]) => [s, new Set(l)]),
);
const CITY_STEMS = Object.fromEntries(
  Object.entries(REGION_DATA.sigungu).map(([s, l]) => [
    s,
    l.filter((n) => n.endsWith("시")).map((n) => [n, n.slice(0, -1)]),
  ]),
);

/**
 * 통합으로 사라진 옛 시 이름. 원본에 `마산시(구)` 처럼 남아 있다.
 * 2010년에 창원·마산·진해가 창원시로 합쳐졌다.
 */
const MERGED_CITY = {
  경남: { 마산시: "창원시", 진해시: "창원시" },
};

/**
 * 시군구를 regions.json 표기로 맞춘다.
 *
 * 원본에 세 가지가 섞여 온다.
 *   `부천시오정구`      일반구 — 시로 올린다
 *   `김해시장유출장소`   출장소 — 시로 올린다
 *   `마산시(구)`        통합 전 옛 이름 — 통합된 시로 바꾼다
 *
 * 셋 다 그냥 두면 regions.json 에 없는 슬러그가 되어 **값은 들어갔는데 페이지가
 * 없는 지역**이 생긴다(apt 에서 27곳이 그랬다).
 */
function normalizeSigungu(sido, raw) {
  let v = String(raw ?? "").trim().replace(/\s+/g, "");
  if (!v || v === sido) return "";
  if ((KNOWN[sido]?.size ?? 0) === 0) return ""; // 세종처럼 하위가 없는 곳
  if (KNOWN[sido]?.has(v)) return v;

  // `마산시(구)` → `마산시`
  v = v.replace(/\((구|폐지)\)$/, "");
  if (KNOWN[sido]?.has(v)) return v;
  const merged = MERGED_CITY[sido]?.[v];
  if (merged && KNOWN[sido]?.has(merged)) return merged;

  // `성남시분당구` 처럼 "시" 가 붙어 오는 경우
  const withSi = v.match(/^(.+?시)(.+)$/);
  if (withSi && KNOWN[sido]?.has(withSi[1])) return withSi[1];

  // `고양덕양구`·`김해시장유출장소` — 시 이름 앞머리로 맞춘다
  for (const [city, stem] of CITY_STEMS[sido] ?? []) {
    if (v.startsWith(stem)) return city;
  }
  return v;
}

function resolveRegion(rawSido, rawGu) {
  const s1 = String(rawSido ?? "").trim();
  const gu = String(rawGu ?? "").trim().replace(/\s+/g, "");
  if (s1 === MERGED_SIDO) {
    const sido = GWANGJU_GU.has(gu) ? "광주" : "전남";
    return { sido, sigungu: normalizeSigungu(sido, gu) };
  }
  const sido = SIDO_SHORT[s1];
  if (!sido) return null;
  return { sido, sigungu: normalizeSigungu(sido, gu) };
}

const regionSlug = (sido, sigungu) => (sigungu ? `${sido}-${sigungu}` : sido);

const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const int = (v) => {
  const n = num(v);
  return n === null ? null : Math.round(n);
};
const str = (v) => {
  const s = String(v ?? "").trim();
  return s && s !== "--" ? s : null;
};

/**
 * 원본에 어린이집 코드가 없어서 키를 만들어 쓴다.
 *
 * **정규화한 값이 아니라 원본 값으로 만든다.** 정규화 규칙을 고치면 키가
 * 바뀌어서, upsert 했을 때 옛 행이 지워지지 않고 고아로 남는다. 실제로
 * 출장소·옛 시 이름 처리를 넣었더니 4개 지역이 그렇게 남았다.
 */
function centerId(rawSido, rawGu, name, address) {
  return crypto
    .createHash("sha1")
    .update([rawSido, rawGu, name, address ?? ""].join("|"))
    .digest("hex")
    .slice(0, 16);
}

function readAll(dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("어린이집기본정보조회") && f.endsWith(".xls"))
    .map((f) => path.join(dir, f))
    .sort();

  if (files.length === 0) {
    console.error(`${dir} 에 어린이집기본정보조회*.xls 가 없습니다.`);
    process.exit(1);
  }

  const seen = new Set();
  const rows = [];
  let baseDate = null;

  for (const file of files) {
    // ESM 에서 XLSX.readFile 은 fs 를 주입해야 쓸 수 있다(XLSX.set_fs).
    // 버퍼로 직접 읽으면 그 과정이 필요 없다.
    const wb = XLSX.read(fs.readFileSync(file), { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    const m = sheetName.match(/(\d{8})/);
    if (m) baseDate = m[1];

    const grid = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
      header: 1,
      raw: false,
      defval: "",
    });
    if (grid.length === 0) continue;

    const head = grid[0].map((h) => String(h).trim());
    if (head.join("|") !== HEADERS.join("|")) {
      // 컬럼이 바뀌면 값이 엉뚱한 칸으로 들어간다. 조용히 넘기지 않는다.
      console.error(`  ! 컬럼이 다릅니다: ${path.basename(file)}`);
      console.error(`    받은 것: ${head.join(" | ")}`);
      process.exit(1);
    }

    let dup = 0;
    for (let i = 1; i < grid.length; i += 1) {
      const r = HEADERS.map((_, c) => String(grid[i][c] ?? "").trim());
      if (!r[2]) continue;
      const key = r.join("");
      if (seen.has(key)) {
        dup += 1;
        continue;
      }
      seen.add(key);
      rows.push(r);
    }
    console.log(
      `  ${path.basename(file).slice(-12).padEnd(12)} ${grid.length - 1}행${dup ? ` (중복 ${dup} 건너뜀)` : ""}`,
    );
  }
  return { rows, baseDate };
}

function toRecord(r, baseDate) {
  const region = resolveRegion(r[0], r[1]);
  if (!region) return null;

  const { sido, sigungu } = region;
  const name = r[2];
  const address = str(r[6]);
  const staff = int(r[13]);
  const capacity = int(r[14]);
  const enrolled = int(r[15]);

  // 위경도가 없는 곳은 서울시청 좌표가 그대로 들어와 있다. 그대로 두면
  // 지도에서 전국 어린이집이 시청 앞에 몰린다.
  const lat = num(r[16]);
  const lng = num(r[17]);
  const placeholder =
    lat !== null && lng !== null &&
    Math.abs(lat - 37.56647) < 1e-5 && Math.abs(lng - 126.977963) < 1e-5;

  return {
    center_id: centerId(r[0], r[1], name, address),
    name,
    region_slug: regionSlug(sido, sigungu),
    sido,
    sigungu,
    kind: str(r[3]),
    status: str(r[4]),
    address,
    tel: str(r[7]),
    homepage: str(r[19]),
    rooms: int(r[9]),
    room_area: num(r[10]),
    playgrounds: int(r[11]),
    cctv: int(r[12]),
    staff,
    capacity,
    enrolled,
    bus: r[18] ? r[18].includes("미운영") === false : null,
    approved_at: str(r[20]),
    lat: placeholder ? null : lat,
    lng: placeholder ? null : lng,
    // 현원·교직원이 있어야 낼 수 있다. 없으면 null 로 두고 지어내지 않는다.
    per_staff: staff && staff > 0 && enrolled && enrolled > 0 ? enrolled / staff : null,
    fill_rate: capacity && capacity > 0 && enrolled !== null ? enrolled / capacity : null,
    base_date: baseDate,
  };
}

async function main() {
  console.log(`읽는 중 — ${DIR}`);
  const { rows, baseDate } = readAll(DIR);
  console.log(`\n중복 제거 후 ${rows.length.toLocaleString()}행 · 기준일 ${baseDate ?? "?"}`);

  const records = [];
  const unknown = new Map();
  for (const r of rows) {
    const rec = toRecord(r, baseDate);
    if (!rec) {
      unknown.set(r[0], (unknown.get(r[0]) ?? 0) + 1);
      continue;
    }
    records.push(rec);
  }

  if (unknown.size) {
    console.warn("\n  ! 시도명을 못 알아본 행:");
    for (const [k, v] of unknown) console.warn(`    ${k} — ${v}건`);
  }

  // center_id 가 겹치면 뒤엣것이 앞엣것을 덮어 조용히 사라진다. 먼저 잡는다.
  const byId = new Map();
  let collision = 0;
  for (const rec of records) {
    if (byId.has(rec.center_id)) collision += 1;
    byId.set(rec.center_id, rec);
  }
  const unique = [...byId.values()];

  const rated = unique.filter((r) => r.per_staff !== null).length;
  console.log(
    `\n적재 대상 ${unique.length.toLocaleString()}곳` +
      `${collision ? ` (키 충돌 ${collision} — 같은 주소·이름)` : ""}`,
  );
  console.log(`  교사 1인당 아동 수를 낼 수 있는 곳 ${rated.toLocaleString()}`);
  console.log(`  지역 ${new Set(unique.map((r) => r.region_slug)).size}개`);

  if (DRY) {
    console.log("\n--dry-run: 적재하지 않고 끝냅니다.");
    console.log(JSON.stringify(unique[0], null, 1));
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(".env.local 의 Supabase 설정을 확인하세요.");
    process.exit(1);
  }
  const sb = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 파일 전체를 받아 넣는 방식이라 **전량 교체**가 맞다. upsert 만 하면
  // 이번에 안 온 어린이집(폐지된 곳)이 예전 값으로 남는다.
  const { error: delErr } = await sb
    .from("daycare_centers")
    .delete()
    .not("center_id", "is", null);
  if (delErr) throw new Error(`기존 행 삭제 실패: ${delErr.message}`);

  const CHUNK = 500;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const { error } = await sb
      .from("daycare_centers")
      .upsert(unique.slice(i, i + CHUNK), { onConflict: "center_id" });
    if (error) throw new Error(`적재 실패 (${i}): ${error.message}`);
    if ((i / CHUNK) % 10 === 0 || i + CHUNK >= unique.length) {
      console.log(`  적재 ${Math.min(i + CHUNK, unique.length).toLocaleString()}/${unique.length.toLocaleString()}`);
    }
  }

  console.log("집계 갱신 중...");
  const { error } = await sb.rpc("refresh_daycare_aggregates");
  if (error) throw new Error(`집계 갱신 실패: ${error.message}`);
  console.log("완료");
}

main().catch((e) => {
  console.error(`\n${e.message ?? e}`);
  process.exit(1);
});
