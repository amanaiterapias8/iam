import { useState, useEffect, useCallback } from "react";

const CATEGORIES = [
  { id: "autoestima", name: "Autoestima", emoji: "💛", gradient: ["#f7971e", "#ffd200"] },
  { id: "amor", name: "Amor propio", emoji: "❤️", gradient: ["#f953c6", "#b91d73"] },
  { id: "exito", name: "Éxito", emoji: "🌟", gradient: ["#4776e6", "#8e54e9"] },
  { id: "calma", name: "Calma", emoji: "🌊", gradient: ["#43cea2", "#185a9d"] },
  { id: "fortaleza", name: "Fortaleza", emoji: "💪", gradient: ["#f7971e", "#f54ea2"] },
  { id: "abundancia", name: "Abundancia", emoji: "🍃", gradient: ["#56ab2f", "#a8e063"] },
  { id: "confianza", name: "Confianza", emoji: "✨", gradient: ["#a18cd1", "#fbc2eb"] },
  { id: "gratitud", name: "Gratitud", emoji: "🙏", gradient: ["#fd746c", "#ff9068"] },
];

const AFFIRMATIONS = {
  autoestima: [
    "Yo soy suficiente exactamente como soy.",
    "Me acepto y me amo profundamente.",
    "Merezco todo lo bueno que llega a mi vida.",
    "Soy valioso/a y digno/a de amor.",
    "Confío en mis habilidades y capacidades.",
    "Cada día me convierto en la mejor versión de mí.",
    "Mi valor no depende de la opinión de otros.",
    "Soy poderoso/a, capaz y fuerte.",
  ],
  amor: [
    "Me amo y me acepto completamente.",
    "Soy digno/a de recibir amor verdadero.",
    "Mi corazón está abierto al amor.",
    "Me cuido y me trato con amabilidad.",
    "Merezco relaciones sanas y amorosas.",
    "Me perdono y me libero del pasado.",
    "El amor comienza en mí.",
    "Soy paz, soy amor, soy luz.",
  ],
  exito: [
    "Estoy creando la vida de mis sueños.",
    "El éxito fluye naturalmente hacia mí.",
    "Tengo todo lo que necesito para triunfar.",
    "Mis metas están al alcance de mis manos.",
    "Cada paso me acerca a mis sueños.",
    "Soy capaz de lograr todo lo que me propongo.",
    "El éxito es mi destino natural.",
    "Atraigo oportunidades de crecimiento.",
  ],
  calma: [
    "Estoy en paz con quien soy.",
    "Respiro profundo y me relajo.",
    "La calma vive dentro de mí.",
    "Confío en el proceso de la vida.",
    "Dejo ir lo que no puedo controlar.",
    "Soy serenidad en medio del caos.",
    "Mi mente está tranquila y en paz.",
    "Elijo la paz sobre la preocupación.",
  ],
  fortaleza: [
    "Soy más fuerte de lo que creo.",
    "Supero cualquier obstáculo que se presente.",
    "Tengo la fuerza para enfrentar este día.",
    "Soy resiliente y me levanto siempre.",
    "Los desafíos me hacen más fuerte.",
    "Puedo con todo lo que se me presente.",
    "Mi fortaleza interior es infinita.",
    "Soy valiente y enfrento mis miedos.",
  ],
  abundancia: [
    "Vivo en abundancia y gratitud.",
    "El universo provee todo lo que necesito.",
    "La prosperidad fluye hacia mí.",
    "Merezco una vida llena de riqueza.",
    "Abro mi corazón a la abundancia.",
    "Las bendiciones me rodean cada día.",
    "Soy un imán para la prosperidad.",
    "La abundancia es mi estado natural.",
  ],
  confianza: [
    "Confío plenamente en mí mismo/a.",
    "Tomo decisiones con seguridad y claridad.",
    "Mi intuición siempre me guía bien.",
    "Soy seguro/a y me expreso libremente.",
    "Confío en mi proceso único.",
    "Tengo fe en mi camino.",
    "Soy auténtico/a y genuino/a.",
    "Mi voz importa y merece ser escuchada.",
  ],
  gratitud: [
    "Soy profundamente agradecido/a por mi vida.",
    "Cada día encuentro razones para sonreír.",
    "Agradezco las bendiciones de hoy.",
    "La gratitud transforma mi perspectiva.",
    "Bendigo cada experiencia de mi vida.",
    "Soy afortunado/a de estar aquí.",
    "Mis ojos ven la belleza en todo.",
    "Gracias por este nuevo día.",
  ],
};

const SCREENS = { home: "home", categories: "categories", affirmation: "affirmation", favorites: "favorites", settings: "settings", streak: "streak" };

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.home);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentAffIdx, setCurrentAffIdx] = useState(0);
  const [favorites, setFavorites] = useLocalStorage("iam_favorites", []);
  const [streak, setStreak] = useLocalStorage("iam_streak", { count: 0, lastDate: null });
  const [seenToday, setSeenToday] = useLocalStorage("iam_seen_today", null);
  const [animating, setAnimating] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [showPremium, setShowPremium] = useState(false);
  const [notifEnabled, setNotifEnabled] = useLocalStorage("iam_notif", false);
  const [notifTime, setNotifTime] = useLocalStorage("iam_notif_time", "08:00");
  const [dailyAff, setDailyAff] = useLocalStorage("iam_daily", null);

  // Update streak
  useEffect(() => {
    const today = new Date().toDateString();
    if (seenToday !== today) {
      setSeenToday(today);
      setStreak(prev => {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = prev.lastDate === yesterday.toDateString();
        return { count: wasYesterday ? prev.count + 1 : 1, lastDate: today };
      });
    }
  }, []);

  // Set daily affirmation
  useEffect(() => {
    const today = new Date().toDateString();
    if (!dailyAff || dailyAff.date !== today) {
      const allAffs = Object.entries(AFFIRMATIONS).flatMap(([cat, affs]) => affs.map(a => ({ text: a, cat })));
      const pick = allAffs[Math.floor(Math.random() * allAffs.length)];
      setDailyAff({ ...pick, date: today });
    }
  }, []);

  const currentAffs = selectedCategory ? AFFIRMATIONS[selectedCategory.id] : [];
  const currentAff = currentAffs[currentAffIdx] || "";
  const isFav = favorites.some(f => f.text === currentAff && f.cat === selectedCategory?.id);

  const triggerAnim = useCallback((cb) => {
    setAnimating(true); setFadeIn(false);
    setTimeout(() => { cb(); setFadeIn(true); setTimeout(() => setAnimating(false), 400); }, 300);
  }, []);

  const nextAff = () => triggerAnim(() => setCurrentAffIdx(i => (i + 1) % currentAffs.length));
  const prevAff = () => triggerAnim(() => setCurrentAffIdx(i => (i - 1 + currentAffs.length) % currentAffs.length));

  const toggleFav = () => {
    if (isFav) {
      setFavorites(f => f.filter(x => !(x.text === currentAff && x.cat === selectedCategory?.id)));
    } else {
      setFavorites(f => [...f, { text: currentAff, cat: selectedCategory?.id, emoji: selectedCategory?.emoji }]);
    }
  };

  const openCategory = (cat) => {
    setSelectedCategory(cat);
    setCurrentAffIdx(0);
    setScreen(SCREENS.affirmation);
  };

  const catById = (id) => CATEGORIES.find(c => c.id === id);

  // Styles
  const S = {
    app: {
      maxWidth: 430, margin: "0 auto", minHeight: "100vh",
      background: "linear-gradient(160deg, #1a0533 0%, #0d0221 50%, #0a1628 100%)",
      position: "relative", overflow: "hidden", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column",
    },
    header: {
      padding: "56px 24px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    },
    headerTitle: { fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 2 },
    navBar: {
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: "rgba(15,5,30,0.95)", backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "12px 0 24px", zIndex: 100,
    },
    navItem: (active) => ({
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      cursor: "pointer", opacity: active ? 1 : 0.4,
      transition: "opacity 0.2s",
      background: "none", border: "none", color: active ? "#c084fc" : "#fff",
    }),
    navIcon: { fontSize: 22 },
    navLabel: { fontSize: 10, fontWeight: 600, letterSpacing: 0.3 },
    scrollArea: { flex: 1, overflowY: "auto", paddingBottom: 100, WebkitOverflowScrolling: "touch" },
    // Home
    streakBadge: {
      margin: "0 24px 24px",
      background: "linear-gradient(135deg, rgba(192,132,252,0.2), rgba(139,92,246,0.1))",
      border: "1px solid rgba(192,132,252,0.3)",
      borderRadius: 20, padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
    },
    streakFire: { fontSize: 40 },
    streakText: { flex: 1 },
    streakCount: { fontSize: 32, fontWeight: 800, color: "#f59e0b", lineHeight: 1 },
    streakLabel: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 },
    dailyCard: {
      margin: "0 24px 24px",
      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
      borderRadius: 24, padding: "28px 24px",
      position: "relative", overflow: "hidden",
    },
    dailyLabel: { fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 },
    dailyText: { fontSize: 22, fontWeight: 600, color: "#fff", lineHeight: 1.4, marginBottom: 16 },
    dailyEmoji: {
      position: "absolute", right: 20, top: 20, fontSize: 48, opacity: 0.3,
    },
    sectionTitle: { fontSize: 20, fontWeight: 700, color: "#fff", padding: "0 24px", marginBottom: 16 },
    catGrid: {
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 24px",
    },
    catCard: (cat) => ({
      background: `linear-gradient(135deg, ${cat.gradient[0]}, ${cat.gradient[1]})`,
      borderRadius: 20, padding: "20px 16px", cursor: "pointer",
      display: "flex", flexDirection: "column", gap: 8,
      transition: "transform 0.15s, box-shadow 0.15s",
      border: "none", textAlign: "left",
      boxShadow: `0 8px 24px ${cat.gradient[0]}40`,
    }),
    catEmoji: { fontSize: 32 },
    catName: { fontSize: 15, fontWeight: 700, color: "#fff" },
    catCount: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
    // Affirmation screen
    affScreen: {
      flex: 1, display: "flex", flexDirection: "column",
      minHeight: "100vh",
    },
    affBg: (cat) => ({
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, height: "100vh", zIndex: 0,
      background: cat ? `linear-gradient(160deg, ${cat.gradient[0]}30, #0d0221 60%)` : "transparent",
      pointerEvents: "none",
    }),
    affHeader: {
      padding: "56px 24px 0",
      display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 1,
    },
    backBtn: {
      background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 12,
      width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", color: "#fff", fontSize: 18,
    },
    affCatTitle: { fontSize: 20, fontWeight: 700, color: "#fff", flex: 1 },
    affCatEmoji: { fontSize: 28 },
    affMain: {
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "32px 32px", position: "relative", zIndex: 1,
      minHeight: "60vh",
    },
    affCard: (fadeIn) => ({
      background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 32, padding: "48px 32px",
      textAlign: "center", width: "100%",
      opacity: fadeIn ? 1 : 0,
      transform: fadeIn ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }),
    affQuote: {
      fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2,
      textTransform: "uppercase", marginBottom: 24, fontWeight: 600,
    },
    affText: {
      fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.45,
      letterSpacing: -0.3,
    },
    affEmoji: { fontSize: 48, marginBottom: 20 },
    affControls: {
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 20, padding: "0 24px 32px", position: "relative", zIndex: 1,
    },
    affBtn: (primary, cat) => ({
      background: primary
        ? (cat ? `linear-gradient(135deg, ${cat.gradient[0]}, ${cat.gradient[1]})` : "linear-gradient(135deg,#7c3aed,#4f46e5)")
        : "rgba(255,255,255,0.08)",
      border: primary ? "none" : "1px solid rgba(255,255,255,0.1)",
      borderRadius: "50%", width: primary ? 64 : 52, height: primary ? 64 : 52,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", fontSize: primary ? 26 : 22, color: "#fff",
      boxShadow: primary ? `0 8px 24px ${cat?.gradient[0] || "#7c3aed"}60` : "none",
      transition: "transform 0.1s",
    }),
    affProgress: {
      display: "flex", gap: 6, alignItems: "center", justifyContent: "center",
      padding: "0 24px 16px", position: "relative", zIndex: 1,
    },
    affDot: (active) => ({
      width: active ? 20 : 6, height: 6, borderRadius: 3,
      background: active ? "#c084fc" : "rgba(255,255,255,0.2)",
      transition: "width 0.3s ease, background 0.3s ease",
    }),
    // Favorites
    favEmpty: {
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "80px 32px", gap: 16, textAlign: "center",
    },
    favEmptyEmoji: { fontSize: 64 },
    favEmptyTitle: { fontSize: 22, fontWeight: 700, color: "#fff" },
    favEmptyText: { fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 },
    favItem: {
      margin: "0 24px 12px",
      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20, padding: "20px",
      display: "flex", gap: 16, alignItems: "flex-start",
    },
    favItemEmoji: { fontSize: 28, marginTop: 2 },
    favItemText: { flex: 1, fontSize: 16, color: "#fff", lineHeight: 1.5, fontWeight: 500 },
    favItemDel: {
      background: "none", border: "none", color: "rgba(255,255,255,0.3)",
      cursor: "pointer", fontSize: 20, padding: 4,
      transition: "color 0.2s",
    },
    // Settings
    settSection: { padding: "0 24px 8px" },
    settTitle: { fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
    settItem: {
      background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: "16px 20px",
      marginBottom: 8, display: "flex", alignItems: "center", gap: 16,
      cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)",
    },
    settIcon: { fontSize: 22, width: 36, textAlign: "center" },
    settLabel: { flex: 1, fontSize: 16, color: "#fff", fontWeight: 500 },
    settValue: { fontSize: 14, color: "rgba(255,255,255,0.4)" },
    toggle: (on) => ({
      width: 50, height: 28, borderRadius: 14,
      background: on ? "#7c3aed" : "rgba(255,255,255,0.15)",
      position: "relative", cursor: "pointer", transition: "background 0.3s",
      border: "none", flexShrink: 0,
    }),
    toggleThumb: (on) => ({
      position: "absolute", top: 3, left: on ? 25 : 3,
      width: 22, height: 22, borderRadius: "50%", background: "#fff",
      transition: "left 0.3s", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    }),
    // Premium modal
    premiumOverlay: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(8px)", zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    },
    premiumModal: {
      background: "linear-gradient(160deg, #1e0845, #0d0221)",
      border: "1px solid rgba(192,132,252,0.2)",
      borderRadius: "32px 32px 0 0", padding: "32px 24px 48px",
      width: "100%", maxWidth: 430,
    },
    premiumClose: {
      position: "absolute", top: 16, right: 16,
      background: "rgba(255,255,255,0.1)", border: "none",
      borderRadius: "50%", width: 32, height: 32,
      color: "#fff", cursor: "pointer", fontSize: 16,
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    premiumTitle: { fontSize: 28, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 8 },
    premiumSub: { fontSize: 15, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 28, lineHeight: 1.5 },
    premiumFeature: { display: "flex", gap: 12, alignItems: "center", marginBottom: 16 },
    premiumFeatureIcon: { fontSize: 20, width: 32 },
    premiumFeatureText: { fontSize: 15, color: "#fff", fontWeight: 500 },
    premiumBtn: (highlight) => ({
      width: "100%", padding: "16px", borderRadius: 16,
      background: highlight ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.08)",
      border: highlight ? "none" : "1px solid rgba(255,255,255,0.1)",
      color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
      marginBottom: 10, transition: "transform 0.1s",
      boxShadow: highlight ? "0 8px 24px #7c3aed60" : "none",
    }),
    premiumPlan: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 18px", borderRadius: 14,
      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
      marginBottom: 10, cursor: "pointer",
    },
    premiumPlanName: { fontSize: 15, color: "#fff", fontWeight: 600 },
    premiumPlanPrice: { fontSize: 15, color: "#c084fc", fontWeight: 700 },
  };

  // Home Screen
  const HomeScreen = () => (
    <div style={S.scrollArea}>
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Hola 👋</div>
          <div style={S.headerSubtitle}>Tu afirmación diaria te espera</div>
        </div>
        <button
          style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 14, padding: "8px 14px", cursor: "pointer", color: "#c084fc", fontSize: 13, fontWeight: 700 }}
          onClick={() => setShowPremium(true)}
        >✨ Premium</button>
      </div>

      {/* Streak */}
      <div style={S.streakBadge} onClick={() => setScreen(SCREENS.streak)}>
        <div style={S.streakFire}>🔥</div>
        <div style={S.streakText}>
          <div style={S.streakCount}>{streak.count}</div>
          <div style={S.streakLabel}>días de racha</div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Ver →</div>
      </div>

      {/* Daily affirmation */}
      {dailyAff && (
        <div style={S.dailyCard} onClick={() => openCategory(catById(dailyAff.cat) || CATEGORIES[0])}>
          <div style={S.dailyEmoji}>{catById(dailyAff.cat)?.emoji || "✨"}</div>
          <div style={S.dailyLabel}>🌅 Afirmación del día</div>
          <div style={S.dailyText}>"{dailyAff.text}"</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
            <span>{catById(dailyAff.cat)?.name}</span>
            <span>• Toca para explorar</span>
          </div>
        </div>
      )}

      {/* Categories */}
      <div style={S.sectionTitle}>Categorías</div>
      <div style={S.catGrid}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} style={S.catCard(cat)} onClick={() => openCategory(cat)}>
            <div style={S.catEmoji}>{cat.emoji}</div>
            <div style={S.catName}>{cat.name}</div>
            <div style={S.catCount}>{AFFIRMATIONS[cat.id].length} afirmaciones</div>
          </button>
        ))}
      </div>

      {/* Quote */}
      <div style={{ margin: "24px 24px 0", padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>💡 Cita inspiradora</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", fontStyle: "italic", lineHeight: 1.5 }}>
          "La mente es todo. En lo que piensas, te conviertes."
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>— Buda</div>
      </div>
    </div>
  );

  // Categories Screen
  const CategoriesScreen = () => (
    <div style={S.scrollArea}>
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Categorías</div>
          <div style={S.headerSubtitle}>Elige lo que necesitas hoy</div>
        </div>
      </div>
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            style={{
              background: `linear-gradient(135deg, ${cat.gradient[0]}20, ${cat.gradient[1]}10)`,
              border: `1px solid ${cat.gradient[0]}40`,
              borderRadius: 20, padding: "20px 24px",
              display: "flex", alignItems: "center", gap: 16,
              cursor: "pointer", textAlign: "left",
              transition: "transform 0.15s",
            }}
            onClick={() => openCategory(cat)}
          >
            <div style={{ fontSize: 40, width: 52, textAlign: "center" }}>{cat.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{cat.name}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{AFFIRMATIONS[cat.id].length} afirmaciones</div>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg, ${cat.gradient[0]}, ${cat.gradient[1]})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "#fff",
            }}>›</div>
          </button>
        ))}
      </div>
    </div>
  );

  // Affirmation Screen
  const AffirmationScreen = () => {
    if (!selectedCategory) return null;
    const cat = selectedCategory;
    const aff = currentAffs[currentAffIdx];
    return (
      <div style={{ ...S.affScreen, position: "relative" }}>
        <div style={S.affBg(cat)} />
        <div style={S.affHeader}>
          <button style={S.backBtn} onClick={() => setScreen(SCREENS.categories)}>‹</button>
          <div style={S.affCatTitle}>{cat.name}</div>
          <div style={S.affCatEmoji}>{cat.emoji}</div>
        </div>

        <div style={S.affMain}>
          <div style={S.affCard(fadeIn)}>
            <div style={S.affEmoji}>{cat.emoji}</div>
            <div style={S.affQuote}>Afirmación</div>
            <div style={S.affText}>"{aff}"</div>
          </div>
        </div>

        {/* Progress dots */}
        <div style={S.affProgress}>
          {currentAffs.map((_, i) => (
            <div key={i} style={S.affDot(i === currentAffIdx)} />
          ))}
        </div>

        {/* Controls */}
        <div style={S.affControls}>
          <button style={S.affBtn(false, cat)} onClick={prevAff} disabled={animating}>‹</button>
          <button style={S.affBtn(true, cat)} onClick={nextAff} disabled={animating}>›</button>
          <button
            style={{ ...S.affBtn(false, cat), background: isFav ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)" }}
            onClick={toggleFav}
          >
            {isFav ? "❤️" : "🤍"}
          </button>
          <button
            style={S.affBtn(false, cat)}
            onClick={() => {
              if (navigator.share) {
                navigator.share({ text: `"${aff}" — Afirmación diaria ✨` });
              } else {
                navigator.clipboard?.writeText(`"${aff}" — Afirmación diaria ✨`);
              }
            }}
          >
            🔗
          </button>
        </div>

        {/* Counter */}
        <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.3)", position: "relative", zIndex: 1, paddingBottom: 100 }}>
          {currentAffIdx + 1} / {currentAffs.length}
        </div>
      </div>
    );
  };

  // Favorites Screen
  const FavoritesScreen = () => (
    <div style={S.scrollArea}>
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Favoritos</div>
          <div style={S.headerSubtitle}>{favorites.length} guardadas</div>
        </div>
      </div>
      {favorites.length === 0 ? (
        <div style={S.favEmpty}>
          <div style={S.favEmptyEmoji}>🤍</div>
          <div style={S.favEmptyTitle}>Sin favoritos aún</div>
          <div style={S.favEmptyText}>Explora las categorías y guarda las afirmaciones que más te inspiren.</div>
          <button
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 14, padding: "14px 28px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 }}
            onClick={() => setScreen(SCREENS.categories)}
          >Explorar afirmaciones</button>
        </div>
      ) : (
        <div>
          {favorites.map((fav, i) => {
            const cat = catById(fav.cat);
            return (
              <div key={i} style={S.favItem}>
                <div style={S.favItemEmoji}>{fav.emoji || "✨"}</div>
                <div style={{ flex: 1 }}>
                  <div style={S.favItemText}>"{fav.text}"</div>
                  {cat && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{cat.name}</div>}
                </div>
                <button
                  style={S.favItemDel}
                  onClick={() => setFavorites(f => f.filter((_, j) => j !== i))}
                >×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Streak Screen
  const StreakScreen = () => {
    const milestones = [1, 7, 14, 21, 30, 60, 90, 365];
    return (
      <div style={S.scrollArea}>
        <div style={S.header}>
          <div>
            <div style={S.headerTitle}>Mi racha 🔥</div>
            <div style={S.headerSubtitle}>Constancia es la clave</div>
          </div>
        </div>

        {/* Big streak display */}
        <div style={{ textAlign: "center", padding: "32px 24px" }}>
          <div style={{ fontSize: 80 }}>🔥</div>
          <div style={{ fontSize: 72, fontWeight: 800, color: "#f59e0b", lineHeight: 1 }}>{streak.count}</div>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
            {streak.count === 1 ? "día consecutivo" : "días consecutivos"}
          </div>
        </div>

        {/* Milestones */}
        <div style={S.sectionTitle}>Hitos</div>
        <div style={{ padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {milestones.map(m => {
            const reached = streak.count >= m;
            return (
              <div key={m} style={{
                background: reached ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                border: reached ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, padding: "16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 28 }}>{reached ? "🏆" : "🔒"}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: reached ? "#f59e0b" : "rgba(255,255,255,0.3)", marginTop: 4 }}>{m}</div>
                <div style={{ fontSize: 12, color: reached ? "rgba(245,158,11,0.7)" : "rgba(255,255,255,0.2)" }}>días</div>
              </div>
            );
          })}
        </div>

        {/* Motivation */}
        <div style={{ margin: "24px", padding: "20px", background: "rgba(124,58,237,0.15)", borderRadius: 20, border: "1px solid rgba(124,58,237,0.3)" }}>
          <div style={{ fontSize: 15, color: "#fff", lineHeight: 1.5, fontWeight: 500 }}>
            {streak.count === 0 && "¡Comienza hoy tu racha! Cada gran viaje empieza con un primer paso. 💪"}
            {streak.count >= 1 && streak.count < 7 && "¡Excelente comienzo! Sigue así y construirás un hábito poderoso. 🌱"}
            {streak.count >= 7 && streak.count < 30 && "¡Una semana de constancia! Estás creando un hábito transformador. 🌟"}
            {streak.count >= 30 && "¡Increíble dedicación! Eres un ejemplo de persistencia y crecimiento. 🏆"}
          </div>
        </div>
      </div>
    );
  };

  // Settings Screen
  const SettingsScreen = () => (
    <div style={S.scrollArea}>
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Configuración</div>
          <div style={S.headerSubtitle}>Personaliza tu experiencia</div>
        </div>
      </div>

      <div style={S.settSection}>
        <div style={S.settTitle}>Premium</div>
        <div
          style={{ ...S.settItem, background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))", border: "1px solid rgba(124,58,237,0.4)", cursor: "pointer" }}
          onClick={() => setShowPremium(true)}
        >
          <div style={S.settIcon}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, color: "#fff", fontWeight: 700 }}>I am Premium</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Desbloquea todas las funciones</div>
          </div>
          <div style={{ fontSize: 13, color: "#c084fc", fontWeight: 700 }}>Ver →</div>
        </div>
      </div>

      <div style={S.settSection}>
        <div style={S.settTitle}>Recordatorios</div>
        <div style={S.settItem}>
          <div style={S.settIcon}>🔔</div>
          <div style={S.settLabel}>Notificaciones diarias</div>
          {/* TODO: Implementar notificaciones push reales con Service Worker */}
          <button style={S.toggle(notifEnabled)} onClick={() => setNotifEnabled(v => !v)}>
            <div style={S.toggleThumb(notifEnabled)} />
          </button>
        </div>
        {notifEnabled && (
          <div style={S.settItem}>
            <div style={S.settIcon}>🕐</div>
            <div style={S.settLabel}>Hora del recordatorio</div>
            <input
              type="time" value={notifTime}
              onChange={e => setNotifTime(e.target.value)}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", padding: "4px 8px", fontSize: 14 }}
            />
          </div>
        )}
      </div>

      <div style={S.settSection}>
        <div style={S.settTitle}>Sobre la app</div>
        {[
          { icon: "📊", label: "Afirmaciones vistas", value: `${streak.count * 3}+` },
          { icon: "❤️", label: "Favoritos guardados", value: favorites.length },
          { icon: "🔥", label: "Racha actual", value: `${streak.count} días` },
        ].map((item, i) => (
          <div key={i} style={S.settItem}>
            <div style={S.settIcon}>{item.icon}</div>
            <div style={S.settLabel}>{item.label}</div>
            <div style={S.settValue}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={S.settSection}>
        <div style={S.settTitle}>Legal</div>
        {[
          { icon: "🔒", label: "Política de privacidad" },
          { icon: "📋", label: "Términos de uso" },
          { icon: "⭐", label: "Calificar la app" },
        ].map((item, i) => (
          <div key={i} style={S.settItem}>
            <div style={S.settIcon}>{item.icon}</div>
            <div style={S.settLabel}>{item.label}</div>
            <div style={S.settValue}>›</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "24px", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
        I am - Afirmaciones Positivas v1.0<br />Hecho con ❤️ para tu bienestar
      </div>
    </div>
  );

  // Premium Modal
  const PremiumModal = () => (
    <div style={S.premiumOverlay} onClick={() => setShowPremium(false)}>
      <div style={{ ...S.premiumModal, position: "relative" }} onClick={e => e.stopPropagation()}>
        <button style={S.premiumClose} onClick={() => setShowPremium(false)}>×</button>
        <div style={{ textAlign: "center", fontSize: 56, marginBottom: 16 }}>✨</div>
        <div style={S.premiumTitle}>I am Premium</div>
        <div style={S.premiumSub}>Desbloquea todas las afirmaciones, categorías exclusivas y más para transformar tu vida.</div>

        {[
          { icon: "♾️", text: "Afirmaciones ilimitadas" },
          { icon: "🎨", text: "Fondos y temas exclusivos" },
          { icon: "🔔", text: "Recordatorios personalizados" },
          { icon: "📊", text: "Estadísticas detalladas" },
          { icon: "🌙", text: "Afirmaciones para dormir" },
        ].map((f, i) => (
          <div key={i} style={S.premiumFeature}>
            <div style={S.premiumFeatureIcon}>{f.icon}</div>
            <div style={S.premiumFeatureText}>{f.text}</div>
            <div style={{ color: "#a3e635", fontSize: 16 }}>✓</div>
          </div>
        ))}

        <div style={{ marginTop: 24, marginBottom: 8 }}>
          {[
            { name: "Mensual", price: "$2.99 / mes" },
            { name: "Anual", price: "$19.99 / año", badge: "Ahorra 44%" },
            { name: "De por vida", price: "$49.99 único" },
          ].map((plan, i) => (
            <div key={i} style={{ ...S.premiumPlan, border: i === 1 ? "1px solid #7c3aed" : "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <div style={S.premiumPlanName}>{plan.name}</div>
                {plan.badge && <div style={{ fontSize: 11, color: "#a3e635", fontWeight: 700, marginTop: 2 }}>{plan.badge}</div>}
              </div>
              <div style={S.premiumPlanPrice}>{plan.price}</div>
            </div>
          ))}
        </div>

        {/* TODO: Implementar pasarela de pago real */}
        <button style={S.premiumBtn(true)} onClick={() => setShowPremium(false)}>
          Empezar prueba gratis
        </button>
        <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          Cancela cuando quieras · Sin compromisos
        </div>
      </div>
    </div>
  );

  const renderScreen = () => {
    if (screen === SCREENS.affirmation) return <AffirmationScreen />;
    if (screen === SCREENS.favorites) return <FavoritesScreen />;
    if (screen === SCREENS.settings) return <SettingsScreen />;
    if (screen === SCREENS.categories) return <CategoriesScreen />;
    if (screen === SCREENS.streak) return <StreakScreen />;
    return <HomeScreen />;
  };

  const navItems = [
    { id: SCREENS.home, icon: "🏠", label: "Inicio" },
    { id: SCREENS.categories, icon: "✨", label: "Explorar" },
    { id: SCREENS.favorites, icon: "❤️", label: "Favoritos" },
    { id: SCREENS.settings, icon: "⚙️", label: "Ajustes" },
  ];

  const activeNav = screen === SCREENS.affirmation ? SCREENS.categories : screen === SCREENS.streak ? SCREENS.home : screen;

  return (
    <div style={S.app}>
      {/* Decorative blobs */}
      <div style={{ position: "fixed", top: -100, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: 100, left: -80, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        {renderScreen()}
      </div>

      {/* Bottom Nav */}
      <div style={S.navBar}>
        {navItems.map(item => (
          <button key={item.id} style={S.navItem(activeNav === item.id)} onClick={() => setScreen(item.id)}>
            <div style={S.navIcon}>{item.icon}</div>
            <div style={S.navLabel}>{item.label}</div>
            {activeNav === item.id && (
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#c084fc" }} />
            )}
          </button>
        ))}
      </div>

      {/* Premium Modal */}
      {showPremium && <PremiumModal />}
    </div>
  );
}