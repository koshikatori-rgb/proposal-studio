'use client';

import { useState, useEffect } from 'react';
import type { Proposal } from '@/types';
import { getProposal, saveProposal } from '@/lib/storage';

export const useProposal = (id: string) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProposal = () => {
      const data = getProposal(id);
      setProposal(data);
      setLoading(false);
    };

    loadProposal();
  }, [id]);

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

  return {
    proposal,
    loading,
    updateProposal,
    updateOutline,
  };
};
