import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAIChat } from '@/api/ai';
import { getErrorMessage } from '@/api/errors';
import { colors, radius, spacing } from '@/theme';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
}

export default function AIAssistantScreen() {
  const chat = useAIChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const idCounter = useRef(0);

  const nextId = () => {
    idCounter.current += 1;
    return String(idCounter.current);
  };

  const send = () => {
    const text = input.trim();
    if (!text || chat.isPending) return;
    setInput('');
    const userMessage: ChatMessage = { id: nextId(), role: 'user', text };
    setMessages((prev) => [...prev, userMessage]);

    // Se envía como contexto la conversación previa reciente.
    const context = messages
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.text}`)
      .join('\n');

    chat.mutate(
      { message: text, context },
      {
        onSuccess: (data) =>
          setMessages((prev) => [
            ...prev,
            { id: nextId(), role: 'assistant', text: data.response },
          ]),
        onError: (error) =>
          setMessages((prev) => [
            ...prev,
            { id: nextId(), role: 'error', text: getErrorMessage(error) },
          ]),
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={16} color={colors.warning} />
        <Text style={styles.disclaimerText}>
          Las respuestas de la IA son sugerencias de apoyo, no diagnósticos confirmados.
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="sparkles" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              Haz una consulta clínica o administrativa al asistente.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user'
                ? styles.bubbleUser
                : item.role === 'error'
                  ? styles.bubbleError
                  : styles.bubbleAssistant,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                item.role === 'error' && styles.bubbleTextError,
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      {chat.isPending ? <Text style={styles.typing}>El asistente está escribiendo…</Text> : null}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu consulta…"
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <Pressable
          style={[styles.sendButton, (!input.trim() || chat.isPending) && { opacity: 0.5 }]}
          onPress={send}
          disabled={!input.trim() || chat.isPending}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.warning}15`,
    margin: spacing.md,
    marginBottom: 0,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  disclaimerText: { flex: 1, fontSize: 12, color: colors.textBody },
  messages: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 260,
  },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  bubble: {
    maxWidth: '85%',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primaryLight },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleError: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.danger}12`,
    borderWidth: 1,
    borderColor: `${colors.danger}40`,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAssistant: { color: colors.textBody },
  bubbleTextError: { color: colors.danger },
  typing: {
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
    marginBottom: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textBody,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
