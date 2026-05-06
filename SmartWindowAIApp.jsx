import { useState, useEffect } from "react";

/* =========================
   위치: 광주광역시 서구 상무지구
========================= */
const LAT = 35.1521;
const LON = 126.8544;

/* =========================
   판단 기준값
========================= */
const DUST_CLOSE = 80; // PM10 ≥ 80 → 닫기
const DUST_OPEN = 40;  // PM10 ≤ 40 → 열기

/* =========================
   무료 공공 API (Open‑Meteo)
========================= */
async function fetchEnvironment() {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=precipitation,pm10,temperature_2m`
    );

    if (!res.ok) throw new Error("API 오류");

    const data = await res.json();

    return {
      isRaining: data.current.precipitation > 0,
      dustLevel: data.current.pm10,
      temperature: data.current.temperature_2m,
      updatedAt: new Date().toLocaleTimeString(),
    };
  } catch (err) {
    console.error("환경 정보 수집 실패:", err);
    return null;
  }
}

/* =========================
   AI 판단 로직 (규칙 기반)
========================= */
function decideWindow(env) {
  if (!env) return "유지";
  if (env.isRaining) return "닫기";
  if (env.dustLevel >= DUST_CLOSE) return "닫기";
  if (env.dustLevel <= DUST_OPEN) return "열기";
  return "유지";
}

/* =========================
   micro:bit 송신 (연결 지점)
========================= */
async function sendToMicrobit(command) {
  console.log(`[micro:bit 전송] ${command}`);
}

/* =========================
   메인 앱
========================= */
export default function SmartWindowAIApp() {
  const [env, setEnv] = useState(null);
  const [decision, setDecision] = useState("유지");
  const [autoMode, setAutoMode] = useState(true);

  // ✅ 10분 주기 자동 갱신
  useEffect(() => {
    async function updateEnv() {
      const data = await fetchEnvironment();
      setEnv(data);
    }

    updateEnv();
    const timer = setInterval(updateEnv, 600000); // 10분
    return () => clearInterval(timer);
  }, []);

  // ✅ AI 자동 판단
  useEffect(() => {
    if (!autoMode) return;
    setDecision(decideWindow(env));
  }, [env, autoMode]);

  // ✅ 자동 제어 시 명령 전송
  useEffect(() => {
    if (!autoMode) return;
    if (decision === "열기") sendToMicrobit("OPEN");
    if (decision === "닫기") sendToMicrobit("CLOSE");
  }, [decision, autoMode]);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 420 }}>
      <h2>AI 자동 창문 개폐 앱</h2>

      <p><b>위치:</b> 광주광역시 서구 상무지구</p>

      {/* 자동 / 수동 전환 */}
      <button onClick={() => setAutoMode(!autoMode)}>
        모드 전환: {autoMode ? "자동" : "수동"}
      </button>

      <hr />

      {/* 실시간 날씨 표시 */}
      <h3>현재 날씨 (자동 갱신)</h3>
      {env ? (
        <ul>
          <li>강수 여부: {env.isRaining ? "비 옴" : "비 없음"}</li>
          <li>미세먼지(PM10): {env.dustLevel}</li>
          <li>기온: {env.temperature} °C</li>
          <li>마지막 갱신 시간: {env.updatedAt}</li>
        </ul>
      ) : (
        <p>날씨 정보 불러오는 중...</p>
      )}

      <p><b>AI 판단:</b> {decision}</p>

      {/* 수동 제어 */}
      {!autoMode && (
        <div>
          <button onClick={() => sendToMicrobit("OPEN")}>
            창문 열기 (수동)
          </button>
          <button onClick={() => sendToMicrobit("CLOSE")}>
            창문 닫기 (수동)
          </button>
        </div>
      )}

      <p style={{ fontSize: 12, marginTop: 20, color: "gray" }}>
        ※ 날씨 정보는 무료 공공 API(Open‑Meteo)를 통해 약 10분 주기로 자동 갱신됩니다.
      </p>
    </div>
  );
}
