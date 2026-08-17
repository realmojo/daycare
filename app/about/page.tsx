import type { Metadata } from "next";
import { buildMetadata, SITE } from "@/lib/seo";
import { OFFICIAL_LINKS } from "@/lib/menu";
import { REGION_HUB_SLUG } from "@/lib/regions";

export const metadata: Metadata = buildMetadata({
  path: "/about",
  title: `사이트 소개 | ${SITE.name}`,
  description:
    "어린이집 정보는 한국사회보장정보원이 공개한 전국 어린이집 자료를 시군구별로 정리해 보여주는 사이트입니다. 데이터 출처와 한계를 함께 밝힙니다.",
});

export default function AboutPage() {
  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>🧸</span>
          사이트 소개
        </h1>
        <p>
          &ldquo;선생님 한 분이 몇 명을 보나&rdquo; — 어디서도 나란히 놓고
          보여주지 않는 숫자입니다.
        </p>
      </div>

      <section className="panel">
        <h2 className="panel__title">무엇을 하는 사이트인가요</h2>
        <p className="panel__desc">
          {SITE.name}는 한국사회보장정보원이 공개하는 전국 어린이집 자료를
          시군구별로 정리해 보여줍니다. 정원·현원·보육교직원 수에서{" "}
          <strong>교사 1인당 아동 수</strong>와 <strong>충원율</strong>을 내어,
          우리 동네 어린이집을 한자리에서 견줄 수 있게 하는 것이 목표입니다.
        </p>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          국공립·민간·가정을 가리지 않고 한 표에 놓습니다. 어느 유형이 낫다고
          말하지 않고 숫자만 나란히 보여줍니다.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">이 자료의 한계</h2>
        <p className="panel__desc">
          가장 오해하기 쉬운 부분이라 먼저 적습니다.{" "}
          <strong>교사 1인당 아동 수는 법정 교사 대 아동 비율이 아닙니다.</strong>
        </p>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>
            분모인 보육교직원 수에 <strong>원장·조리원·사무원이 함께</strong>{" "}
            들어갑니다. 담임교사만 센 값이 아니므로, 이 숫자가 낮다고 법을 지킨
            것도 높다고 어긴 것도 아닙니다.
          </li>
          <li>
            <strong>현원은 계속 바뀝니다.</strong> 아이가 들어오고 나가면
            달라지고, 공개 자료에 반영되기까지 시차가 있습니다.
          </li>
          <li>
            <strong>숫자가 좋다고 좋은 곳이 아닙니다.</strong> 아이가 잘
            지내는지는 교사와 아이의 관계, 프로그램, 분위기에서 나오고 그건 표에
            안 담깁니다. 반드시 직접 가 보세요.
          </li>
          <li>
            평가 결과는 이 자료에 없습니다.{" "}
            <a
              href={OFFICIAL_LINKS.childcare}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              어린이집 정보공개 포털
            </a>
            에서 확인하세요.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">데이터 출처와 범위</h2>
        <p className="panel__desc">
          한국사회보장정보원{" "}
          <a
            href={OFFICIAL_LINKS.dataset}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            어린이집 기본정보
          </a>
          를 그대로 집계했습니다. 원본에 없는 값을 추정해서 채우지 않습니다.
        </p>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>제공 기관: 한국사회보장정보원</li>
          <li>수록: 전국 어린이집 25,595곳 (기준일 2026년 7월 31일)</li>
          <li>
            항목: 유형·운영현황·주소·전화, 정원·현원·보육교직원 수,
            보육실·놀이터·CCTV, 통학차량, 인가일자
          </li>
          <li>공공저작물 제1유형(출처표시)</li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">이 사이트가 하지 않는 것</h2>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>
            <strong>어린이집을 추천하거나 순위를 매기지 않습니다.</strong>{" "}
            숫자를 나란히 놓을 뿐이고 고르는 것은 보호자의 몫입니다.
          </li>
          <li>
            <strong>입소 상담이나 대기 신청을 받지 않습니다.</strong> 대기는{" "}
            <a
              href={OFFICIAL_LINKS.ilove}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              아이사랑
            </a>
            에서 신청하세요.
          </li>
          <li>
            <strong>보육료를 안내하지 않습니다.</strong> 지원금과 부담금은
            제도와 연령에 따라 달라지므로 공식 창구에서 확인해야 합니다.
          </li>
        </ul>
      </section>

      <div className="empty-box">
        <a
          target="_self"
          href={`/${REGION_HUB_SLUG}`}
          style={{ textDecoration: "underline" }}
        >
          지역별 어린이집 보러 가기
        </a>
      </div>
    </>
  );
}
