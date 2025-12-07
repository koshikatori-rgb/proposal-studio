'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/common/Button';
import type { ChatSession } from '@/types';

type ChatInterfaceProps = {
  proposalId: string;
  section: ChatSession['section'];
  onUpdate?: (data: any) => void;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  proposalId,
  section,
  onUpdate,
}) => {
  const { messages, sendMessage, loading } = useChat(proposalId, section);
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    await sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter (Mac) または Ctrl+Enter (Windows/Linux) で送信
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!input.trim() || loading) return;
      handleSubmit(e as any);
    }
  };

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      current_recognition: '現状認識の言語化',
      issue_setting: '課題仮説の特定',
      tobe_vision: 'ToBe像とアプローチ',
      approach: 'アプローチ詳細',
    };
    return titles[section] || 'AI対話';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-200">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">{getSectionTitle()}</h3>
        <p className="text-sm text-gray-600 mt-1">
          AIと対話しながら内容を整理しましょう
        </p>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-2">対話を開始しましょう</p>
            <p className="text-sm">
              現状の状況や課題について、AIに話しかけてください
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="animate-bounce">●</div>
                <div className="animate-bounce delay-100">●</div>
                <div className="animate-bounce delay-200">●</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 入力フォーム */}
      <div className="px-6 py-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力... (Cmd/Ctrl+Enterで送信)"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none"
              rows={2}
            />
          </div>
          <Button type="submit" disabled={loading || !input.trim()}>
            送信
          </Button>
        </form>
      </div>
    </div>
  );
};
