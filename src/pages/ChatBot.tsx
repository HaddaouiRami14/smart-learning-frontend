import { useTheme } from "@/hooks/useTheme";
import { useState, useRef, useEffect } from "react";

const API_URL = "/api/chat";

export default function ChatBot({ apprenantId }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Bonjour ! Je suis votre assistant SmartLearning 👋 Posez-moi une question sur votre apprentissage ou demandez-moi quels cours suivre.",
      courses: [],
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const { theme } = useTheme();
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Ajoute le message de l'apprenant
    setMessages((prev) => [...prev, { role: "user", text, courses: [] }]);
    setInput("");
    setLoading(true);

    try {
      const res  = await fetch(API_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ apprenantId, message: text }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role:    "assistant",
          text:    data.reply,
          courses: data.recommendations ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Une erreur est survenue. Réessayez.", courses: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.dot} />
        <span style={{ fontWeight: 600 }}>Assistant SmartLearning</span>
      </div>

      {/* Messages */}
      <div style={styles.messages} ref={messagesContainerRef}>
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === "user" ? styles.userMsg : styles.botMsg}>
            {/* Texte */}
            <p style={{ margin: "0 0 8px" }}>{msg.text}</p>

            {/* Cartes de cours */}
            {msg.courses?.length > 0 && (
              <div style={styles.courseList}>
                {msg.courses.map((c) => (
                  <div key={c.courseId} style={styles.courseCard}>
                    <div style={styles.courseHeader}>
                      <span style={styles.courseTitle}>{c.title}</span>
                      <span style={styles.scoreBadge}>{c.score}%</span>
                    </div>
                    {c.description && (
                      <p style={styles.courseDesc}>
                        {c.description.length > 100
                          ? c.description.slice(0, 100) + "..."
                          : c.description}
                      </p>
                    )}
                    {c.reason && (
                      <p style={styles.courseReason}>💡 {c.reason}</p>
                    )}
                    <a href={`/courses/${c.courseId}/enroll`} style={styles.courseLink}>
                      Voir le cours →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Indicateur de frappe */}
        {loading && (
          <div style={styles.botMsg}>
            <span style={styles.typing}>● ● ●</span>
          </div>
        )}
        
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Posez votre question..."
          disabled={loading}
        />
        <button style={styles.sendBtn} onClick={send} disabled={loading}>
          Envoyer
        </button>
      </div>
    </div>
  );
}

// ─── Styles inline ────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    display:       "flex",
    flexDirection: "column",
    height:        "600px",
    width:         "100%",
    maxWidth:      "480px",
    border:       "1px solid hsl(var(--border))",
    borderRadius:  "16px",
    overflow:      "hidden",
    fontFamily:    "system-ui, sans-serif",
    fontSize:      "14px",
    background:   "hsl(var(--background))",
    boxShadow:     "0 4px 24px rgba(0,0,0,0.08)",
  },
  header: {
    display:        "flex",
    alignItems:     "center",
    gap:            "10px",
    padding:        "16px 20px",
    background: "hsl(var(--card))",
    color:      "hsl(var(--foreground))",
    borderBottom: "1px solid hsl(var(--border))",
  },
  dot: {
    width:        "10px",
    height:       "10px",
    borderRadius: "50%",
    background:   "#22c55e",
    display:      "inline-block",
  },
  messages: {
    flex:       1,
    overflowY:  "auto",
    padding:    "16px",
    display:    "flex",
    flexDirection: "column",
    gap:        "12px",
    background: "hsl(var(--muted))",
  },
  userMsg: {
    alignSelf:    "flex-end",
    background: "hsl(var(--primary))",
    color:      "hsl(var(--primary-foreground))",
    padding:      "10px 14px",
    borderRadius: "16px 16px 4px 16px",
    maxWidth:     "80%",
  },
  botMsg: {
    alignSelf:    "flex-start",
    background: "hsl(var(--card))",
    color:      "hsl(var(--foreground))",
    padding:      "12px 16px",
    borderRadius: "16px 16px 16px 4px",
    maxWidth:     "90%",
    border:     "1px solid hsl(var(--border))",
  },
  typing: {
    color:      "#9ca3af",
    fontSize:   "18px",
    letterSpacing: "4px",
  },
  courseList: {
    display:       "flex",
    flexDirection: "column",
    gap:           "8px",
    marginTop:     "8px",
  },
  courseCard: {
    background: "hsl(var(--muted))",
    border:     "1px solid hsl(var(--border))",
    borderRadius: "10px",
    padding:      "10px 12px",
  },
  courseHeader: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   "4px",
  },
  courseTitle: {
    fontWeight: 600,
    color:      "#3730a3",
    fontSize:   "13px",
  },
  scoreBadge: {
    background:   "#4f46e5",
    color:        "#fff",
    borderRadius: "20px",
    padding:      "2px 8px",
    fontSize:     "11px",
    fontWeight:   600,
  },
  courseDesc: {
    margin:  "4px 0",
    color: "hsl(var(--muted-foreground))",
    fontSize:"12px",
    
  },
  courseReason: {
    margin:     "4px 0 8px",
    color: "hsl(var(--muted-foreground))",
    fontSize:   "12px",
    fontStyle:  "italic",
  },
  courseLink: {
    color:          "#4f46e5",
    fontWeight:     600,
    fontSize:       "12px",
    textDecoration: "none",
  },
  inputRow: {
    display:   "flex",
    gap:       "8px",
    padding:   "12px 16px",
    borderTop:  "1px solid hsl(var(--border))",
    background: "hsl(var(--background))",
    
  },
  input: {
    flex:        1,
    padding:     "10px 14px",
    borderRadius:"10px",
    border:     "1px solid hsl(var(--border))",
    fontSize:    "14px",
    outline:     "none",
    background: "hsl(var(--background))",
    color:      "hsl(var(--foreground))",
  },
  sendBtn: {
    padding:      "10px 18px",
    background:   "#4f46e5",
    color:        "#fff",
    border:       "none",
    borderRadius: "10px",
    fontWeight:   600,
    cursor:       "pointer",
    fontSize:     "14px",
  },
};