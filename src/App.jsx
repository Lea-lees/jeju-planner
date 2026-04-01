import { useState } from "react";

const typeConfig = {
  "식사": { bg: "#fff0f3", text: "#c0527a", border: "#f9a8c0", icon: "🍽️" },
  "카페": { bg: "#e0faf5", text: "#0f8a72", border: "#3ecfb2", icon: "☕" },
  "관광": { bg: "#e8f4fd", text: "#2a7db5", border: "#5bb8f5", icon: "🏖️" },
  "쇼핑": { bg: "#fff8e8", text: "#a07010", border: "#f5c842", icon: "🛍️" },
  "숙소": { bg: "#f0eeff", text: "#6040c0", border: "#b09cf5", icon: "🏠" },
  "기타": { bg: "#f0fafa", text: "#4a8080", border: "#90caca", icon: "📍" },
};
const typeOptions = Object.keys(typeConfig);

const defaultDays = [
  {
    id: 1, label: "1일차", date: "", startTime: "12:00", endTime: "17:00", travelMin: 15,
    stops: [
      { id: 1, place: "함덕흑돼지 우돈향", type: "식사", duration: 60, note: "바다뷰 흑돼지 구이" },
      { id: 2, place: "BEECAVE 비케이브", type: "카페", duration: 90, note: "꽃밭+동굴 포토존" },
      { id: 3, place: "로미뮤직하우스", type: "카페", duration: 90, note: "LP 음악 카페" },
    ]
  },
];

function addMinutes(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function minutesBetween(t1, t2) {
  const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  return toMin(t2) - toMin(t1);
}

export default function App() {
  const [days, setDays] = useState(defaultDays);
  const [activeDay, setActiveDay] = useState(1);
  const [nextDayId, setNextDayId] = useState(2);
  const [nextStopId, setNextStopId] = useState(10);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const day = days.find(d => d.id === activeDay);
  const updateDay = (id, patch) => setDays(days.map(d => d.id === id ? { ...d, ...patch } : d));

  const addDay = () => {
    const newDay = { id: nextDayId, label: `${days.length + 1}일차`, date: "", startTime: "09:00", endTime: "18:00", travelMin: 15, stops: [] };
    setDays([...days, newDay]);
    setNextDayId(nextDayId + 1);
    setActiveDay(nextDayId);
  };
  const removeDay = id => {
    if (days.length === 1) return;
    const remaining = days.filter(d => d.id !== id);
    setDays(remaining);
    setActiveDay(remaining[0].id);
  };

  const computed = () => {
    if (!day) return [];
    let cur = day.startTime;
    return day.stops.map(s => { const t = { ...s, time: cur }; cur = addMinutes(cur, s.duration + day.travelMin); return t; });
  };
  const comp = computed();
  const lastEnd = comp.length > 0 ? addMinutes(comp[comp.length - 1].time, comp[comp.length - 1].duration) : (day?.startTime || "");
  const slackMin = day ? minutesBetween(day.startTime, day.endTime) - (comp.reduce((a, s) => a + s.duration, 0) + Math.max(0, comp.length - 1) * (day?.travelMin || 0)) : 0;

  const openAdd = () => { setForm({ place: "", type: "관광", duration: 60, note: "" }); setEditing("new"); };
  const openEdit = s => { setForm({ ...s }); setEditing(s.id); };
  const saveForm = () => {
    if (!form.place || !day) return;
    if (editing === "new") {
      updateDay(day.id, { stops: [...day.stops, { ...form, id: nextStopId, duration: Number(form.duration) }] });
      setNextStopId(nextStopId + 1);
    } else {
      updateDay(day.id, { stops: day.stops.map(s => s.id === editing ? { ...form, id: editing, duration: Number(form.duration) } : s) });
    }
    setEditing(null);
  };
  const removeStop = id => day && updateDay(day.id, { stops: day.stops.filter(s => s.id !== id) });
  const moveStop = (idx, dir) => {
    if (!day) return;
    const arr = [...day.stops]; const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    updateDay(day.id, { stops: arr });
  };

  const iconBtn = (onClick, children, extra = {}) => (
    <button onClick={onClick} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, padding: "4px 9px", border: "1px solid rgba(0,180,180,0.25)", borderRadius: 8, background: "#fff", color: "#1a3a3a", cursor: "pointer", ...extra }}>{children}</button>
  );

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "linear-gradient(160deg, #e8f8f5 0%, #e8f4fd 100%)", minHeight: "100vh" }}>

      {/* 헤더 */}
      <div style={{ height: 160, background: "linear-gradient(135deg, #2ec4a9 0%, #3eb5e5 50%, #89cff0 100%)", display: "flex", alignItems: "flex-end", padding: "0 20px 20px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>여행 일정 플래너 🗺️</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", margin: "3px 0 0" }}>날짜별로 일정을 관리해보세요</p>
        </div>
        <button onClick={openAdd} style={{ background: "rgba(255,255,255,0.25)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.5)", fontWeight: 700, padding: "8px 14px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>+ 장소 추가</button>
      </div>

      {/* 날짜 탭 */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(0,180,180,0.15)", padding: "0 1rem", display: "flex", alignItems: "center", gap: 4, overflowX: "auto" }}>
        {days.map((d, i) => (
          <button
            key={d.id}
            draggable
            onDragStart={e => e.dataTransfer.setData("dayId", String(d.id))}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const fromId = Number(e.dataTransfer.getData("dayId"));
              if (fromId === d.id) return;
              const arr = [...days];
              const fromIdx = arr.findIndex(x => x.id === fromId);
              const toIdx = arr.findIndex(x => x.id === d.id);
              const [moved] = arr.splice(fromIdx, 1);
              arr.splice(toIdx, 0, moved);
              const renamed = arr.map((x, idx) => ({
                ...x,
                label: x.label.match(/^\d+일차$/) ? `${idx + 1}일차` : x.label
              }));
              setDays(renamed);
            }}
            onClick={() => setActiveDay(d.id)}
            style={{
              fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
              padding: "12px 16px", border: "none", background: "transparent", cursor: "grab", whiteSpace: "nowrap",
              color: activeDay === d.id ? "#3ecfb2" : "#5a8a8a",
              borderBottom: activeDay === d.id ? "2.5px solid #3ecfb2" : "2.5px solid transparent",
              userSelect: "none",
            }}>
            {d.label}{d.date ? ` · ${d.date}` : ""}
          </button>
        ))}
        <button onClick={addDay} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, padding: "12px 12px", border: "none", background: "transparent", cursor: "pointer", color: "#5a8a8a", whiteSpace: "nowrap" }}>+ 날짜 추가</button>
      </div>

      <div style={{ padding: "1.25rem 1rem", maxWidth: 560, margin: "0 auto" }}>

        {/* 날짜 설정 */}
        {day && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(0,180,180,0.15)", padding: "12px 14px", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <input value={day.label} onChange={e => updateDay(day.id, { label: e.target.value })}
                style={{ fontSize: 15, fontWeight: 700, border: "none", outline: "none", color: "#1a2e2e", fontFamily: "'Nunito', sans-serif", background: "transparent", width: 100 }} />
              <input type="date" value={day.date} onChange={e => updateDay(day.id, { date: e.target.value })}
                style={{ fontSize: 12, border: "1px solid rgba(0,180,180,0.2)", borderRadius: 8, padding: "4px 8px", color: "#5a8a8a", fontFamily: "'Nunito', sans-serif", outline: "none" }} />
              {days.length > 1 && (
                <button onClick={() => removeDay(day.id)} style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #f9a8c0", borderRadius: 8, background: "#fff0f3", color: "#c0527a", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>날짜 삭제</button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[{ label: "🕐 출발", key: "startTime" }, { label: "🚗 이동(분)", key: "travelMin" }, { label: "🏁 목표", key: "endTime" }].map(item => (
                <div key={item.key} style={{ background: "#f8fffe", borderRadius: 8, padding: "8px 10px" }}>
                  <p style={{ fontSize: 11, color: "#5a8a8a", margin: "0 0 3px" }}>{item.label}</p>
                  {item.key === "travelMin"
                    ? <input type="number" min={0} max={120} value={day.travelMin} onChange={e => updateDay(day.id, { travelMin: Number(e.target.value) })} style={{ width: "100%", fontSize: 14, fontWeight: 700, border: "none", background: "transparent", color: "#1a3a3a", padding: 0, outline: "none", fontFamily: "'Nunito', sans-serif" }} />
                    : item.key === "startTime"
                    ? <input type="time" value={day.startTime} onChange={e => updateDay(day.id, { startTime: e.target.value })} style={{ width: "100%", fontSize: 14, fontWeight: 700, border: "none", background: "transparent", color: "#1a3a3a", padding: 0, outline: "none", fontFamily: "'Nunito', sans-serif" }} />
                    : <input type="time" value={day.endTime} onChange={e => updateDay(day.id, { endTime: e.target.value })} style={{ width: "100%", fontSize: 14, fontWeight: 700, border: "none", background: "transparent", color: "#1a3a3a", padding: 0, outline: "none", fontFamily: "'Nunito', sans-serif" }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 알림 */}
        {slackMin < 0 && <div style={{ background: "#fff0f3", border: "1px solid #f9a8c0", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", fontSize: 13, color: "#c0527a" }}>⚠️ 일정이 {Math.abs(slackMin)}분 초과돼요!</div>}
        {slackMin >= 0 && slackMin <= 30 && <div style={{ background: "#fff8e8", border: "1px solid #f5c842", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", fontSize: 13, color: "#a07010" }}>⏰ 여유 시간이 {slackMin}분밖에 없어요!</div>}
        {slackMin > 30 && <div style={{ background: "#e0faf5", border: "1px solid #3ecfb2", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", fontSize: 13, color: "#0f8a72" }}>✅ 여유 시간 {slackMin}분 남아요!</div>}

        {/* 일정 목록 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {comp.map((s, i) => {
            const col = typeConfig[s.type] || typeConfig["기타"];
            const endT = addMinutes(s.time, s.duration);
            return (
              <div key={s.id}>
                <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36, flexShrink: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: col.bg, border: `2px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, marginTop: 10, flexShrink: 0 }}>{col.icon}</div>
                    {i < comp.length - 1 && <div style={{ width: 2, flex: 1, background: "rgba(0,180,180,0.2)", marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, background: "#fff", border: "1.5px solid rgba(0,180,180,0.15)", borderRadius: 16, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: col.text, background: col.bg, padding: "2px 9px", borderRadius: 20 }}>{s.type}</span>
                          <span style={{ fontSize: 12, color: "#5a8a8a" }}>{s.time} – {endT}</span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 2px", color: "#1a2e2e" }}>{s.place}</p>
                        {s.note && <p style={{ fontSize: 12, color: "#5a8a8a", margin: 0 }}>{s.note}</p>}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 8 }}>
                        {iconBtn(() => moveStop(i, -1), "↑", { opacity: i === 0 ? 0.3 : 1, cursor: i === 0 ? "default" : "pointer" })}
                        {iconBtn(() => moveStop(i, 1), "↓", { opacity: i === comp.length - 1 ? 0.3 : 1, cursor: i === comp.length - 1 ? "default" : "pointer" })}
                        {iconBtn(() => openEdit(s), "수정")}
                        <button onClick={() => removeStop(s.id)} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, padding: "4px 9px", border: "1px solid #f9a8c0", borderRadius: 8, background: "#fff0f3", color: "#c0527a", cursor: "pointer" }}>삭제</button>
                      </div>
                    </div>
                  </div>
                </div>
                {i < comp.length - 1 && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 36, display: "flex", justifyContent: "center" }}>
                      <div style={{ width: 2, height: 24, background: "rgba(0,180,180,0.2)" }} />
                    </div>
                    <span style={{ fontSize: 12, color: "#5a8a8a" }}>🚗 이동 {day?.travelMin}분</span>
                  </div>
                )}
              </div>
            );
          })}

          {comp.length > 0 && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
              <div style={{ width: 36, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 24, background: "rgba(0,180,180,0.2)" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#5bb8f5" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2e2e" }}>{lastEnd} 도착 🏁</span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20, ...(lastEnd <= (day?.endTime || "") ? { background: "#e0faf5", color: "#0f8a72" } : { background: "#fff0f3", color: "#c0527a" }) }}>
                {lastEnd <= (day?.endTime || "") ? "목표 내 도착" : "목표 초과"}
              </span>
            </div>
          )}

          {comp.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "#5a8a8a", fontSize: 14 }}>
              장소를 추가해서 일정을 만들어보세요 🗺️
            </div>
          )}
        </div>
      </div>

      {/* 모달 */}
      {editing !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,60,80,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "1.5rem", width: 300, border: "1.5px solid rgba(0,180,180,0.2)" }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 1rem", color: "#1a2e2e" }}>{editing === "new" ? "장소 추가" : "장소 수정"}</p>
            {[{ label: "장소 이름", key: "place", type: "text" }, { label: "메모", key: "note", type: "text" }, { label: "체류 시간 (분)", key: "duration", type: "number" }].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#5a8a8a", display: "block", marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ width: "100%", boxSizing: "border-box", fontFamily: "'Nunito', sans-serif", fontSize: 14, border: "1.5px solid rgba(0,180,180,0.2)", borderRadius: 10, padding: "7px 10px", color: "#1a3a3a", outline: "none" }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#5a8a8a", display: "block", marginBottom: 4 }}>유형</label>
              <select value={form.type || "기타"} onChange={e => setForm({ ...form, type: e.target.value })}
                style={{ width: "100%", fontFamily: "'Nunito', sans-serif", fontSize: 14, border: "1.5px solid rgba(0,180,180,0.2)", borderRadius: 10, padding: "7px 10px", color: "#1a3a3a", outline: "none" }}>
                {typeOptions.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={{ fontSize: 13, padding: "8px 14px", cursor: "pointer", border: "1px solid rgba(0,180,180,0.2)", borderRadius: 10, background: "#fff", fontFamily: "'Nunito', sans-serif" }}>취소</button>
              <button onClick={saveForm} style={{ fontSize: 13, padding: "8px 16px", cursor: "pointer", border: "none", borderRadius: 10, background: "linear-gradient(135deg, #3ecfb2, #5bb8f5)", color: "#fff", fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}