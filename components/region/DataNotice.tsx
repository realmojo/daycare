import { OFFICIAL_LINKS } from "@/lib/menu";

/**
 * 모든 화면 하단 공통 안내.
 *
 * **교사 1인당 아동 수를 법정 비율과 헷갈리게 두면 안 된다.** 원본의
 * 보육교직원수에는 원장·조리원·사무원이 함께 들어간다. 담임교사만 센 값이
 * 아닌데 그대로 견주면 "법을 어겼다" 는 잘못된 결론으로 간다.
 * 이 설명이 이 사이트에서 가장 중요한 안내다.
 */
export default function DataNotice() {
  return (
    <div className="notice">
      <p style={{ margin: "0 0 8px" }}>
        <strong>이 숫자를 어떻게 읽어야 하나</strong>
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          한국사회보장정보원이 공개한 자료를 그대로 정리한 것입니다. 원본에 없는
          값을 추정해 채우지 않습니다.
        </li>
        <li>
          <strong>
            교사 1인당 아동 수는 법정 교사 대 아동 비율과 다릅니다.
          </strong>{" "}
          원본의 보육교직원수에는 <strong>원장·조리원·사무원이 함께</strong>{" "}
          들어갑니다. 담임교사만 센 값이 아니므로, 이 숫자가 낮다고 법을 어긴
          것도 높다고 지킨 것도 아닙니다. 어린이집 사이의{" "}
          <strong>상대적인 여유를 견주는 용도</strong>로만 보세요.
        </li>
        <li>
          <strong>현원은 계속 바뀝니다.</strong> 아이가 들어오고 나가면 달라지고,
          공개 자료에 반영되기까지 시차가 있습니다. 지금 이 순간의 값이 아닙니다.
        </li>
        <li>
          <strong>숫자가 좋다고 좋은 곳도 아닙니다.</strong> 아이가 잘 지내는지는
          교사와 아이의 관계, 프로그램, 분위기에서 나오고 그건 표에 안 담깁니다.
          <strong> 반드시 직접 가 보세요.</strong>
        </li>
        <li>
          평가 결과와 입소 대기는{" "}
          <a
            href={OFFICIAL_LINKS.childcare}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            어린이집 정보공개 포털
          </a>
          과{" "}
          <a
            href={OFFICIAL_LINKS.ilove}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            아이사랑
          </a>
          에서 확인하세요.
        </li>
      </ul>
    </div>
  );
}
