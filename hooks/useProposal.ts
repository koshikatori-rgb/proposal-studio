'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Proposal } from '@/types';
import { getProposal, saveProposal } from '@/lib/storage';

export const useProposal = (id: string) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  // ストレージからproposalを読み込む関数
  const loadProposal = useCallback(() => {
    setLoading(true);
    const data = getProposal(id);
    console.log('🔄 useProposal: データを読み込み', id, data?.outline ? '✅ outline有り' : '❌ outline無し');
    if (data?.outline) {
      console.log('  - currentRecognition.background:', data.outline.currentRecognition?.background?.substring(0, 50) || '(なし)');
      console.log('  - slideStructureProposal:', data.outline.slideStructureProposal?.length || 0, '枚');
      console.log('  - visualRecommendations:', data.outline.visualRecommendations ? '有り' : 'なし');
    }
    setProposal(data);
    setLoading(false);
    return data;
  }, [id]);

  // 初期ロードとid変更時にデータを読み込む
  useEffect(() => {
    loadProposal();
  }, [loadProposal]);

  const updateProposal = (updates: Partial<Proposal>) => {
    if (!proposal) return;

    const updated = {
      ...proposal,
      ...updates,
      updatedAt: Date.now(),
    };

    saveProposal(updated);
    setProposal(updated);
  };

  const updateOutline = (outlineUpdates: Partial<Proposal['outline']>) => {
    if (!proposal) return;

    const updated = {
      ...proposal,
      outline: {
        ...proposal.outline,
        ...outlineUpdates,
      },
      updatedAt: Date.now(),
    };

    saveProposal(updated);
    setProposal(updated);
  };

  // ストレージからproposalを再読み込み
  const refresh = () => {
    const data = getProposal(id);
    setProposal(data);
  };

  return {
    proposal,
    loading,
    updateProposal,
    updateOutline,
    refresh,
  };
};
