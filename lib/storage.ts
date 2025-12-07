import type { Proposal, ChatSession } from '@/types';

export const STORAGE_KEYS = {
  PROPOSALS: 'proposals',
  CURRENT_PROPOSAL_ID: 'currentProposalId',
  CHAT_SESSIONS: 'chatSessions',
  SETTINGS: 'settings',
};

// Proposal操作

export const saveProposal = (proposal: Proposal): void => {
  if (typeof window === 'undefined') return;

  const proposals = getProposals();
  const index = proposals.findIndex(p => p.id === proposal.id);

  if (index >= 0) {
    proposals[index] = proposal;
  } else {
    proposals.push(proposal);
  }

  localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(proposals));
};

export const getProposals = (): Proposal[] => {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(STORAGE_KEYS.PROPOSALS);
  return data ? JSON.parse(data) : [];
};

export const getProposal = (id: string): Proposal | null => {
  const proposals = getProposals();
  return proposals.find(p => p.id === id) || null;
};

export const deleteProposal = (id: string): void => {
  if (typeof window === 'undefined') return;

  const proposals = getProposals().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(proposals));
};

// ChatSession操作

export const saveChatSession = (session: ChatSession): void => {
  if (typeof window === 'undefined') return;

  const sessions = getChatSessions();
  const index = sessions.findIndex(
    s => s.proposalId === session.proposalId && s.section === session.section
  );

  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }

  localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
};

export const getChatSessions = (): ChatSession[] => {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
  return data ? JSON.parse(data) : [];
};

export const getChatSession = (
  proposalId: string,
  section: ChatSession['section']
): ChatSession | null => {
  const sessions = getChatSessions();
  return sessions.find(
    s => s.proposalId === proposalId && s.section === section
  ) || null;
};

export const deleteChatSession = (
  proposalId: string,
  section: ChatSession['section']
): void => {
  if (typeof window === 'undefined') return;

  const sessions = getChatSessions().filter(
    s => !(s.proposalId === proposalId && s.section === section)
  );
  localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
};

// 現在の提案書ID

export const setCurrentProposalId = (id: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CURRENT_PROPOSAL_ID, id);
};

export const getCurrentProposalId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.CURRENT_PROPOSAL_ID);
};

// ストレージクリア

export const clearStorage = (): void => {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};
