'use client';

import { useState, useEffect } from 'react';
import type { ChatMessage, ChatSession } from '@/types';
import { getChatSession, saveChatSession } from '@/lib/storage';
import { generateId } from '@/lib/utils';

export const useChat = (
  proposalId: string,
  section: ChatSession['section']
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getChatSession(proposalId, section);
    if (session) {
      setMessages(session.messages);
    }
  }, [proposalId, section]);

  const sendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          section,
        }),
      });

      if (!response.ok) {
        throw new Error('Chat API request failed');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // セッションを保存
      saveChatSession({
        proposalId,
        section,
        messages: updatedMessages,
      });
    } catch (error) {
      console.error('Chat error:', error);
      // エラーメッセージを追加
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '申し訳ございません。エラーが発生しました。もう一度お試しください。',
        timestamp: Date.now(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    saveChatSession({
      proposalId,
      section,
      messages: [],
    });
  };

  return {
    messages,
    sendMessage,
    clearMessages,
    loading,
  };
};
