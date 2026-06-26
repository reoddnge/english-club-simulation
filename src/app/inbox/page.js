"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function InboxPage() {
  const [messages, setMessages] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);

  /* ======================
     SESSION
  ====================== */
  useEffect(() => {
    setStudentId(localStorage.getItem("studentId"));
  }, []);

  /* ======================
     LIVE INBOX STREAM
  ====================== */
  useEffect(() => {
    if (!studentId) return;

    return onSnapshot(
      collection(db, "classes", "demo", "messages"),
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => m.toId === studentId)
          .sort((a, b) => {
            // unread first, then newest first
            if (a.read !== b.read) return a.read ? 1 : -1;
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
          });

        setMessages(data);
      }
    );
  }, [studentId]);

  /* ======================
     OPEN MESSAGE
  ====================== */
  async function openMessage(msg) {
    setSelectedMsg(msg);

    if (!msg.read) {
      await updateDoc(
        doc(db, "classes", "demo", "messages", msg.id),
        { read: true }
      );
    }
  }

  /* ======================
     DERIVED STATE
  ====================== */
  const unreadCount = messages.filter((m) => !m.read).length;

  /* ======================
     LOADING
  ====================== */
  if (!studentId) {
    return (
      <div style={styles.container}>
        Loading inbox...
      </div>
    );
  }

  /* ======================
     UI
  ====================== */
  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h2>📡 Inbox</h2>

        <span style={styles.badge}>
          {unreadCount} unread
        </span>
      </div>

      <div style={styles.layout}>

        {/* LIST */}
        <div style={styles.list}>
          {messages.length === 0 && (
            <p style={{ opacity: 0.6 }}>No messages</p>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              onClick={() => openMessage(m)}
              style={{
                ...styles.card,
                background: m.read ? "#111827" : "#1f2937",
                borderLeft: m.read
                  ? "3px solid #374151"
                  : "3px solid #3b82f6",
                opacity: m.read ? 0.7 : 1
              }}
            >

              <div style={styles.row}>
                <b>
                  {m.fromRole === "teacher"
                    ? "👨‍🏫 Teacher"
                    : "👤 Player"}
                </b>

                {!m.read && <span style={styles.dot} />}
              </div>

              <p style={styles.preview}>
                {m.text?.slice(0, 80)}
              </p>

            </div>
          ))}
        </div>

        {/* VIEWER */}
        <div style={styles.viewer}>
          {!selectedMsg ? (
            <p style={{ opacity: 0.6 }}>
              Select a message to read
            </p>
          ) : (
            <>
              <h3>
                {selectedMsg.fromRole === "teacher"
                  ? "👨‍🏫 Teacher Message"
                  : "👤 Message"}
              </h3>

              <div style={styles.messageBox}>
                {selectedMsg.text}
              </div>

              <p style={styles.meta}>
                {selectedMsg.read ? "Read" : "Unread"}
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

/* ======================
   STYLES
====================== */

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0b1220",
    color: "white",
    padding: 20,
    fontFamily: "sans-serif"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15
  },

  badge: {
    background: "#2563eb",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: 12
  },

  list: {
    background: "#111827",
    borderRadius: 12,
    padding: 10,
    overflowY: "auto",
    maxHeight: "80vh"
  },

  viewer: {
    background: "#0f172a",
    borderRadius: 12,
    padding: 15
  },

  card: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    cursor: "pointer"
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#3b82f6"
  },

  preview: {
    opacity: 0.7,
    fontSize: 13,
    marginTop: 6
  },

  messageBox: {
    marginTop: 10,
    padding: 12,
    background: "#111827",
    borderRadius: 10,
    minHeight: 120,
    whiteSpace: "pre-wrap"
  },

  meta: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.6
  }
};