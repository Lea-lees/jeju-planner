import { useState } from "react";

const defaultStops = [
  { id: 1, place: "함덕흑돼지 우돈향", type: "식사", time: "12:00", duration: 60, note: "바다뷰 흑돼지 구이" },
  { id: 2, place: "BEECAVE 비케이브", type: "카페", time: "13:15", duration: 90, note: "꽃밭+동굴 포토존, 화요일 휴무" },
  { id: 3, place: "로미뮤직하우스", type: "카페", time: "15:00", duration: 90, note: "LP 음악 카페" },
];

const typeColors = {
  "식사": { bg: "#FAECE7", text: "#993C1D", border: "#F0997B" },
  "카페": { bg: "#E1F5EE", text: "#0F6E56", border: "#5DCAA5" },
  "관광": { bg: "#E6F1FB", text: "#185FA5", border: "#85B7EB" },
  "쇼핑": { bg: "#FAEEDA", text: "#854F0B", border: "#EF9F27" },
  "숙소": { bg: "#EEEDFE", text: "#534AB7", border: "#AFA9EC" },
  "기타": { bg: "#F1EFE8", text: "#5F5E5A", border: "#B4B2A9" },
};

const typeOptions = Object.keys(typeColors);

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
  const [stops, setStops] = useState(defaultStops);
  const [nextId, setNextId] = useState(4);
  const [travelMin, setTravelMin] = useState(15);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("17:00");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const computedStops = () => {
    let cur = startTime;
    return stops.map((s) => {
      const t = { ...s, time: cur };
      cur = addMinutes(cur, s.duration + travelMin);
      return t;
    });
  };

  const computed = computedStops();
  const lastEnd = computed.length > 0 ? addMinutes(computed[computed.length - 1].time, computed[computed.length - 1].duration) : startTime;
  const totalMin = minutesBetween(startTime, endTime);
  const usedMin = computed.reduce((a, s) => a + s.duration, 0) + Math.max(0, computed.length - 1) * travelMin;
  const slackMin = totalMin - usedMin;

  const openAdd = () => {
    setForm({ place: "", type: "관광", duration: 60, note: "" });
    setEditing("new");
  };
  const openEdit = (s) => { setForm({ ...s }); setEditing(s.id); };
  const saveForm = () => {
    if (!form.place) return;
    if (editing === "new") {
      setStops([...stops, { ...form, id: nextId, duration: Number(form.duration) }]);
      setNextId(nextId + 1);
    } else {
      setStops(stops.map(s => s.id === editing ? { ...form, id: editing, duration: Number(form.duration) } : s));
    }
    setEditing(null);
  };
  const remove = (id) => setStops(stops.filter(s => s.id !== id));
  const move = (idx, dir) => {
    const arr = [...stops];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setStops(arr);
  };

  return (
    <div style={{ padding: "1.5rem 1rem", maxWidth: 600, margin: "0 auto", fontFamily: "var(--font-sans)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ fontSize: 22, fontWeight: 500, margin: 0, color: "var(--color-text-primary)" }}>여행 일정 플래너</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "4px 0 0" }}>장소를 추가하고 순서를 조정해보세요</p>
        </div>
        <button onClick={openAdd}>+ 장소 추가</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: "1.5rem" }}>
        {[
          { label: "출발", key: "start" },
          { label: "이동 시간 (분)", key: "travel" },
          { label: "도착 목표", key: "end" },
        ].map(item => (
          <div key={item.key} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
            <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>{item.label}</p>
            {item.key === "travel" ? (
              <input type="number" min={0} max={120} value={travelMin} onChange={e => setTravelMin(Number(e.target.value))}
                style={{ width: "100%", fontSize: 16, fontWeight: 500, border: "none", background: "transparent", color: "var(--color-text-primary)", padding: 0 }} />
            ) : item.key === "start" ? (
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                style={{ width: "100%", fontSize: 16, fontWeight: 500, border: "none", background: "transparent", color: "var(--color-text-primary)", padding: 0 }} />
            ) : (
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                style={{ width: "100%", fontSize: 16, fontWeight: 500, border: "none", background: "transparent", color: "var(--color-text-primary)", padding: 0 }} />
            )}
          </div>
        ))}
      </div>

      {slackMin < 0 && (
        <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: "8px", padding: "10px 14px", marginBottom: "1rem", fontSize: 13, color: "#A32D2D" }}>
          일정이 {Math.abs(slackMin)}분 초과돼요. 장소를 줄이거나 체류 시간을 조정해보세요.
        </div>
      )}
      {slackMin >= 0 && slackMin <= 30 && (
        <div style={{ background: "#FAEEDA", border: "0.5px solid #EF9F27", borderRadius: "8px", padding: "10px 14px", marginBottom: "1rem", fontSize: 13, color: "#854F0B" }}>
          여유 시간이 {slackMin}분밖에 없어요. 빡빡할 수 있어요!
        </div>
      )}
      {slackMin > 30 && (
        <div style={{ background: "#E1F5EE", border: "0.5px solid #5DCAA5", borderRadius: "8px", padding: "10px 14px", marginBottom: "1rem", fontSize: 13, color: "#0F6E56" }}>
          여유 시간 {slackMin}분 남아요. 장소를 더 추가해도 좋아요!
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {computed.map((s, i) => {
          const col = typeColors[s.type] || typeColors["기타"];
          const endT = addMinutes(s.time, s.duration);
          return (
            <div key={s.id}>
              <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.border, marginTop: 18, flexShrink: 0 }} />
                  {i < computed.length - 1 && <div style={{ width: 2, flex: 1, background: "#e0e0e0", marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: "12px", padding: "12px 14px", marginBottom: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: col.text, background: col.bg, padding: "2px 8px", borderRadius: 4 }}>{s.type}</span>
                        <span style={{ fontSize: 13, color: "#6b6b6b" }}>{s.time} – {endT}</span>
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 2px", color: "#1a1a1a" }}>{s.place}</p>
                      {s.note && <p style={{ fontSize: 12, color: "#6b6b6b", margin: 0 }}>{s.note}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 8 }}>
                      <button onClick={() => move(i, -1)} disabled={i === 0} style={{ fontSize: 12, padding: "4px 7px", opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                      <button onClick={() => move(i, 1)} disabled={i === computed.length - 1} style={{ fontSize: 12, padding: "4px 7px", opacity: i === computed.length - 1 ? 0.3 : 1 }}>↓</button>
                      <button onClick={() => openEdit(s)} style={{ fontSize: 12, padding: "4px 7px" }}>수정</button>
                      <button onClick={() => remove(s.id)} style={{ fontSize: 12, padding: "4px 7px", color: "#A32D2D" }}>삭제</button>
                    </div>
                  </div>
                </div>
              </div>
              {i < computed.length - 1 && (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
                    <div style={{ width: 2, height: 24, background: "#e0e0e0" }} />
                  </div>
                  <span style={{ fontSize: 12, color: "#6b6b6b" }}>이동 {travelMin}분</span>
                </div>
              )}
            </div>
          );
        })}

        {computed.length > 0 && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 2, height: 24, background: "#e0e0e0" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#6b6b6b" }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>{lastEnd} 도착</span>
            {lastEnd > endTime
              ? <span style={{ fontSize: 12, color: "#A32D2D", background: "#FCEBEB", padding: "2px 8px", borderRadius: 4 }}>{endTime} 목표 초과</span>
              : <span style={{ fontSize: 12, color: "#0F6E56", background: "#E1F5EE", padding: "2px 8px", borderRadius: 4 }}>{endTime} 목표 내 도착</span>
            }
          </div>
        )}
      </div>

      {stops.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "#6b6b6b", fontSize: 14 }}>
          장소를 추가해서 일정을 만들어보세요
        </div>
      )}

      {editing !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", width: 320, border: "0.5px solid #e0e0e0" }}>
            <p style={{ fontSize: 16, fontWeight: 500, margin: "0 0 1rem", color: "#1a1a1a" }}>{editing === "new" ? "장소 추가" : "장소 수정"}</p>
            {[
              { label: "장소 이름", key: "place", type: "text" },
              { label: "메모", key: "note", type: "text" },
              { label: "체류 시간 (분)", key: "duration", type: "number" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#6b6b6b", display: "block", marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#6b6b6b", display: "block", marginBottom: 4 }}>유형</label>
              <select value={form.type || "기타"} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: "100%" }}>
                {typeOptions.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)}>취소</button>
              <button onClick={saveForm}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}