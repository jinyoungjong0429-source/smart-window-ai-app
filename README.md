# smart-window-ai-app
AI 기반 자동 창문 개폐 제어 앱 (프로토타입)
import { useState, useEffect } from "react";

/**
 * ===============================
 * 환경 기준값 (조정 가능)
 * ===============================
 */
const DUST_CLOSE = 80;
const DUST_OPEN = 40;

/**
 * ===============================
 * 외부 환경 정보 수집 (API)
 * ===============================
 * 실제 배포 시 API Key만 교체
 */
async function fetchEnvironment() {
  try {
    // 예시: OpenWeather + 미세먼지 API (여기선 가상 응답)
    // 실제 사용 시 fetch(url)로 교체
    return {
      isRaining: Math.random() < 0.2, // 예시 데이터
      dustLevel: Math.floor(Math.random() * 120),
    };
  } catch (e) {
    return null;
  }
}

/**
 * ===============================
 * AI 판단 로직 (규칙 기반)
 * ===============================
 */
function decideWindow(env) {
  if (!env) return "유지";
  if (env.isRaining) return "닫기";
  if (env.dustLevel >= DUST_CLOSE) return "닫기";
  if (env.dustLevel <= DUST_OPEN) return "열기";
  return "유지";
}

/**
 * ===============================
 * micro:bit 전송 (Stub)
 * ===============================
 * BLE 연동 시 이 함수만 교체
 */
async function sendToMicrobit(command) {
  console.log(`[micro:bit 전송] ${command}`);
  return true;
}

/**
 * ===============================
 * 메인 앱
 * ===============================
 */
export default function SmartWindowAIApp() {
  const [env, setEnv] = useState(null);
  const [decision, setDecision] = useState("유지");
  const [lastSent, setLastSent] = useState("");
  const [autoMode, setAutoMode] = useState(true);
  const [status, setStatus] = useState("대기");

  /**
   * 환경 정보 주기적 수집 (10분)
   */
  useEffect(() => {
    async function updateEnv() {
      setStatus("환경 정보 수집 중");
      const data = await fetchEnvironment();
      if (data) {
        setEnv(data);
        setStatus("환경 반영 완료");
      } else {
        setStatus("환경 정보 수집 실패");
      }
    }

    updateEnv();
    const timer = setInterval(updateEnv, 600000);
    return () => clearInterval(timer);
  }, []);

  /**
   * AI 판단
   */
  useEffect(() => {
    if (!autoMode) return;
    const next = decideWindow(env);
    setDecision(next);
  }, [env, autoMode]);

  /**
   * 명령 전송(중복 방지)
   */
  useEffect(() => {
    if (!autoMode) return;
    if (decision === "유지") return;
    if (decision === lastSent) return;

    async function act() {
      setStatus(`명령 전송 중: ${decision}`);
      const ok = await sendToMicrobit(
        decision === "열기" ? "OPEN" : "CLOSE"
      );
      if (ok) {
        setLastSent(decision);
        setStatus(`완료: ${decision}`);
      } else {
        setStatus("전송 실패");
      }
    }
    act();
  }, [decision, autoMode]);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>AI 자동 창문 개폐 제어 앱</h2>

      <p><b>자동 모드:</b> {autoMode ? "ON" : "OFF"}</p>
      <button onClick={() => setAutoMode(!autoMode)}>
        자동 모드 전환
      </button>

      <hr />

      <p><b>환경 정보</b></p>
      <pre>{JSON.stringify(env, null, 2)}</pre>

      <p><b>AI 판단:</b> {decision}</p>
      <p><b>상태:</b> {status}</p>

      {!autoMode && (
        <>
          <button onClick={() => sendToMicrobit("OPEN")}>열기</button>
          <button onClick={() => sendToMicrobit("CLOSE")}>닫기</button>
        </>
      )}
    </div>
  );
}
