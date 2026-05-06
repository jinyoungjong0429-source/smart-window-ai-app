const LAT = 35.1521;
const LON = 126.8544;

let autoMode = true;

// ✅ 무료 공공 API (Open‑Meteo)
async function fetchWeather() {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=precipitation,pm10,temperature_2m`
  );
  const data = await res.json();
  return {
    rain: data.current.precipitation > 0,
    dust: data.current.pm10,
    temp: data.current.temperature_2m,
  };
}

function decide(env) {
  if (env.rain) return "닫기";
  if (env.dust >= 80) return "닫기";
  if (env.dust <= 40) return "열기";
  return "유지";
}

async function update() {
  const env = await fetchWeather();
  const decision = decide(env);

  document.getElementById("weather").innerHTML = `
    비: ${env.rain ? "옴" : "없음"}<br/>
    미세먼지: ${env.dust}<br/>
    기온: ${env.temp}℃
  `;

  document.getElementById("decision").innerText =
    "AI 판단: " + decision;

  if (autoMode) {
    console.log("자동 제어:", decision);
  }
}

function toggleMode() {
  autoMode = !autoMode;
  alert(autoMode ? "자동 모드" : "수동 모드");
}

function sendManual(cmd) {
  if (!autoMode) {
    console.log("수동 명령:", cmd);
  }
}

// ✅ 최초 실행 + 10분 주기
update();
setInterval(update, 600000);
