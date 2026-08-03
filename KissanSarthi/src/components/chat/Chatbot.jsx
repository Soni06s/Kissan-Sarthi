import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/theme';
import { Icon } from '../common/Icon';
import { getBotResponse } from '../../utils/chatbotLogic';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [msgs, setMsgs] = useState([{ role: "bot", text: t('chatbot.welcome') }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing, open]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMsgs(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setTyping(true);
    
    setTimeout(() => {
      setTyping(false);
      setMsgs(prev => [...prev, { role: "bot", text: getBotResponse(userMsg) }]);
    }, 1000);
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 1000,
        width: 56, height: 56, borderRadius: 18, border: "none", cursor: "pointer",
        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
        boxShadow: "0 4px 20px rgba(46,125,50,0.4)", color: "white", fontSize: 24
      }}>
        {open ? "✕" : "🤖"}
      </button>

      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 24, zIndex: 999,
          width: 340, height: 480, borderRadius: 20, background: "white",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)", border: `1px solid ${COLORS.border}`
        }}>
          <div style={{ background: COLORS.primary, padding: 15, color: "white", fontWeight: 700 }}>{t('chatbot.title')}</div>
          <div style={{ flex: 1, overflowY: "auto", padding: 15, background: "#F9FBF9" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? COLORS.primary : "white",
                color: m.role === "user" ? "white" : COLORS.text,
                padding: "8px 12px", borderRadius: 12, marginBottom: 8, fontSize: 13,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)", maxWidth: "80%"
              }}>{m.text}</div>
            ))}
            {typing && <div style={{ fontSize: 10, color: COLORS.textMuted }}>{t('chatbot.thinking')}</div>}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: 10, borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={t('chatbot.askAnything')} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
            <button onClick={handleSend} style={{ background: COLORS.primary, border: "none", padding: "8px 12px", borderRadius: 8, color: "white" }}>{t('chatbot.send')}</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;