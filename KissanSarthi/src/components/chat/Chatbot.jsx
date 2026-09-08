import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/theme';
import { Icon } from '../common/Icon';
import { chatAPI } from '../../services/api';
import { getBotResponse } from '../../utils/chatbotLogic';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const [msgs, setMsgs] = useState([{ role: "bot", text: t('chatbot.welcome') }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const bottomRef = useRef(null);

  // Update initial welcome message when language changes if conversation hasn't started
  useEffect(() => {
    setMsgs(prev => {
      if (prev.length <= 1) {
        return [{ role: "bot", text: t('chatbot.welcome') }];
      }
      return prev;
    });
  }, [i18n.language, t]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing, open]);

  // Clean speech on unmount or close
  useEffect(() => {
    if (!open && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [open]);

  // Speech Synthesis Utterance
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Clean markdown tags, emojis, and formatting
      const clean = text
        .replace(/[*#_`~>]/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(clean);
      const langCode = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'gu' ? 'gu-IN' : 'en-IN';
      utterance.lang = langCode;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error', err);
    }
  };

  // Web Speech Recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or an Android browser.');
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const langCode = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'gu' ? 'gu-IN' : 'en-IN';
      recognition.lang = langCode;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInput(transcript);
          sendMessage(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setListening(false);
    }
  };

  const sendMessage = async (userMsg) => {
    if (!userMsg.trim()) return;
    setMsgs(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setTyping(true);

    try {
      const res = await chatAPI.send(userMsg);
      const replyText = res.data?.data?.reply || res.data?.reply || getBotResponse(userMsg);
      setMsgs(prev => [...prev, { role: "bot", text: replyText }]);
      if (speechEnabled) {
        speakText(replyText);
      }
    } catch (err) {
      console.warn("Chatbot backend fallback", err);
      const fallbackReply = getBotResponse(userMsg);
      setMsgs(prev => [...prev, { role: "bot", text: fallbackReply }]);
      if (speechEnabled) {
        speakText(fallbackReply);
      }
    } finally {
      setTyping(false);
    }
  };

  const handleSend = () => {
    sendMessage(input.trim());
  };

  const QUICK_PROMPTS = [
    t('chatbot.quickPrompts.wheatIrrigation', "🌾 Wheat irrigation timing?"),
    t('chatbot.quickPrompts.fertilizerDosage', "💊 Urea & DAP dosage per acre?"),
    t('chatbot.quickPrompts.organicPest', "🐛 Best organic pest spray?"),
    t('chatbot.quickPrompts.mandiTrends', "📊 Today Mandi trends"),
  ];

  const handleQuickPrompt = (promptText) => {
    setInput(promptText);
    // Auto-trigger send
    setTimeout(() => {
      setMsgs(prev => [...prev, { role: "user", text: promptText }]);
      setTyping(true);
      chatAPI.send(promptText)
        .then(res => {
          const replyText = res.data?.data?.reply || res.data?.reply || getBotResponse(promptText);
          setMsgs(prev => [...prev, { role: "bot", text: replyText }]);
        })
        .catch(err => {
          console.warn("Chatbot backend fallback", err);
          const fallbackReply = getBotResponse(promptText);
          setMsgs(prev => [...prev, { role: "bot", text: fallbackReply }]);
        })
        .finally(() => setTyping(false));
    }, 50);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open KissanBot AI"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 58, height: 58, borderRadius: 20, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${COLORS.primary}, #1B5E20)`,
          boxShadow: "0 6px 24px rgba(46,125,50,0.45)", color: "white", fontSize: 24,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {open ? "✕" : "🌱"}
      </button>

      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 24, zIndex: 999,
          width: 380, maxWidth: "calc(100vw - 36px)", height: 540, maxHeight: "calc(100vh - 120px)",
          borderRadius: 22, background: "white",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.22)", border: `1px solid ${COLORS.border}`,
          animation: "fadeInUp 0.3s ease"
        }}>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.primary}, #1B5E20)`,
            padding: "16px 18px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🌾</span>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{t('chatbot.title', 'KissanBot AI')}</span>
                <span style={{ fontSize: 10, background: "rgba(255,255,255,0.22)", padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>
                  Gemini Flash
                </span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{t('chatbot.subtitle', 'Real-time Indian Agronomy Advisor')}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => {
                  const next = !speechEnabled;
                  setSpeechEnabled(next);
                  if (!next && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                }}
                title={speechEnabled ? "Voice Output ON (Click to mute)" : "Voice Output OFF (Click to enable auto-reading)"}
                style={{
                  background: speechEnabled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)",
                  border: "none",
                  color: "white",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <Icon name="speaker" size={16} color="white" />
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", color: "white", fontSize: 18, cursor: "pointer", opacity: 0.8 }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 14px", background: "#f5f9f5", borderBottom: `1px solid ${COLORS.border}`, scrollbarWidth: "none" }}>
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(qp)}
                style={{
                  whiteSpace: "nowrap", fontSize: 11, fontWeight: 600,
                  padding: "5px 10px", borderRadius: 12, border: `1px solid ${COLORS.primary}33`,
                  background: "white", color: COLORS.primaryDark, cursor: "pointer"
                }}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16, background: "#F9FBF9", display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background: m.role === "user" ? COLORS.primary : "white",
                  color: m.role === "user" ? "white" : COLORS.text,
                  padding: "10px 14px", borderRadius: 14,
                  fontSize: 13, lineHeight: 1.5,
                  boxShadow: m.role === "user" ? "0 2px 8px rgba(46,125,50,0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
                  border: m.role === "user" ? "none" : `1px solid ${COLORS.border}`,
                  maxWidth: "85%", whiteSpace: "pre-line", wordBreak: "break-word"
                }}
              >
                <div>{m.text}</div>
                {m.role === "bot" && (
                  <button
                    onClick={() => speakText(m.text)}
                    title="Listen aloud"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: COLORS.primary,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      marginTop: 6,
                      padding: 0,
                      opacity: 0.85,
                    }}
                  >
                    <Icon name="speaker" size={13} /> Listen Aloud
                  </button>
                )}
              </div>
            ))}
            {typing && (
              <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.primary, animation: "pulse 1s infinite" }} />
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>{t('chatbot.consulting', 'KissanBot consulting AI...')}</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Listening Indicator Bar */}
          {listening && (
            <div style={{ background: "#FEF2F2", borderTop: "1px solid #FECACA", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#DC2626", fontWeight: 700 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626", animation: "pulse 0.8s infinite" }} />
              Listening ({i18n.language === 'hi' ? 'हिंदी' : i18n.language === 'gu' ? 'ગુજરાતી' : 'English'})... Speak your question clearly
            </div>
          )}

          {/* Input Area */}
          <div style={{ padding: "12px 14px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 8, background: "white", alignItems: "center" }}>
            <button
              type="button"
              onClick={startListening}
              title={listening ? "Listening... click to cancel" : "Speak question in voice (Mic)"}
              style={{
                background: listening ? "#DC2626" : "#F1F8E9",
                border: listening ? "none" : `1px solid ${COLORS.border}`,
                color: listening ? "white" : COLORS.primary,
                width: 40,
                height: 40,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              <Icon name="mic" size={18} color={listening ? "white" : COLORS.primary} />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={t('chatbot.placeholder', 'Ask anything about your crops, soil, pests...')}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 12,
                border: `1px solid ${COLORS.border}`, outline: "none", fontSize: 13
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                background: input.trim() ? COLORS.primary : COLORS.border,
                border: "none", padding: "10px 16px", borderRadius: 12,
                color: "white", fontWeight: 700, fontSize: 13, cursor: input.trim() ? "pointer" : "default"
              }}
            >
              {t('buttons.send', 'Send')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;