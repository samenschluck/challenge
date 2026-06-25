import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';
import { sendChatMessage, subscribeChatMessages } from '../services/firestoreService';
import { displayName } from '../utils/displayName';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (isToday) return time;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${time}`;
}

export default function ChatScreen() {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsub = subscribeChatMessages(msgs => {
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 80);
    });
    return unsub;
  }, []);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || !currentUser || sending) return;
    setSending(true);
    setText('');
    try {
      await sendChatMessage({
        userId: currentUser.id,
        userName: displayName(currentUser),
        userAvatar: currentUser.avatar,
        userAvatarColor: currentUser.avatarColor,
        text: trimmed,
        timestamp: Date.now(),
      });
    } finally {
      setSending(false);
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <LinearGradient colors={['#0f0f1a', '#0f0f1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>💬 Gruppen-Chat</Text>
            <Text style={styles.headerSub}>Nur für die Challenge-Gruppe</Text>
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.length === 0 && (
              <Text style={styles.emptyHint}>Noch keine Nachrichten – seid die Ersten! 🚀</Text>
            )}

            {messages.map((msg, i) => {
              const isMe = msg.userId === currentUser?.id;
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const showAvatar = !prevMsg || prevMsg.userId !== msg.userId;
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.msgRow,
                    isMe ? styles.msgRowMe : styles.msgRowThem,
                    !showAvatar && (isMe ? styles.msgRowNoAvatarMe : styles.msgRowNoAvatarThem),
                  ]}
                >
                  {!isMe && (
                    <View style={styles.avatarSlot}>
                      {showAvatar ? (
                        <View style={[styles.avatarCircle, { backgroundColor: msg.userAvatarColor + '33', borderColor: msg.userAvatarColor }]}>
                          <Text style={styles.avatarEmoji}>{msg.userAvatar}</Text>
                        </View>
                      ) : (
                        <View style={styles.avatarPlaceholder} />
                      )}
                    </View>
                  )}

                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    {showAvatar && !isMe && (
                      <Text style={[styles.senderName, { color: msg.userAvatarColor }]}>{msg.userName}</Text>
                    )}
                    <Text style={styles.msgText}>{msg.text}</Text>
                    <Text style={styles.msgTime}>{formatTime(msg.timestamp)}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Nachricht..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={send}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
              onPress={send}
              disabled={!text.trim() || sending}
            >
              <Text style={styles.sendBtnIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  messageList: { padding: 16, paddingBottom: 8, gap: 2 },
  emptyHint: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14, marginTop: 40, lineHeight: 22 },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  msgRowNoAvatarMe: { marginBottom: 1 },
  msgRowNoAvatarThem: { marginBottom: 1 },

  avatarSlot: { width: 36, marginRight: 8 },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 16 },
  avatarPlaceholder: { width: 32 },

  bubble: { maxWidth: '72%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, paddingBottom: 7 },
  bubbleMe: { backgroundColor: COLORS.primary + 'cc', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: COLORS.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },

  senderName: { fontSize: 11, fontWeight: '800', marginBottom: 3 },
  msgText: { fontSize: 15, color: COLORS.text, lineHeight: 21 },
  msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4, textAlign: 'right' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: '#0f0f1a',
  },
  input: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: 10, color: COLORS.text, fontSize: 15, borderWidth: 1,
    borderColor: COLORS.border, maxHeight: 120,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendBtnIcon: { fontSize: 20, color: '#fff', fontWeight: '800', marginTop: -2 },
});
