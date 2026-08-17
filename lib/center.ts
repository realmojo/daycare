/**
 * 어린이집 슬러그.
 *
 * `/서울-강남구/햇살어린이집-a1b2c3d4e5f6` 처럼 **이름 + center_id** 로 만든다.
 *
 * 이름만 쓰면 안 된다. "행복어린이집"·"햇살어린이집" 같은 이름이 전국에 수십
 * 개 있고 한 시군구 안에서도 겹친다. 원본에 어린이집 코드가 없어서 적재
 * 스크립트가 시도+시군구+이름+주소로 만든 해시를 꼬리로 쓴다.
 *
 * 조회는 **꼬리로만** 한다. 이름이 바뀌어도 꼬리가 맞으면 같은 곳이라,
 * 예전 주소로 들어온 링크가 안 깨진다.
 */

function slugifyName(name: string): string {
  return (
    String(name ?? "")
      .toLowerCase()
      .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50)
      .replace(/-+$/g, "") || "어린이집"
  );
}

export function centerSlug(name: string, centerId: string): string {
  return `${slugifyName(name)}-${centerId}`;
}

/** 슬러그 꼬리에서 center_id 를 되찾는다 (16자리 16진수) */
export function centerIdFromSlug(slug: string): string | null {
  const m = String(slug ?? "").match(/-([0-9a-f]{16})$/i);
  return m ? m[1].toLowerCase() : null;
}

/** 인가일자(YYYY-MM-DD 또는 YYYYMMDD)에서 연도만 */
export function approvedYear(value: string | null): number | null {
  const m = String(value ?? "").match(/(\d{4})/);
  if (!m) return null;
  const y = Number(m[1]);
  return y >= 1950 && y <= 2100 ? y : null;
}

/** "2012년 인가 · 14년차" */
export function ageText(value: string | null, now = new Date()): string {
  const y = approvedYear(value);
  if (!y) return "-";
  const age = now.getFullYear() - y;
  return age > 0 ? `${y}년 인가 · ${age}년차` : `${y}년 인가`;
}
