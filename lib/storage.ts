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

// 抽出キャッシュ操作（チャット履歴のハッシュを保存）

const EXTRACTION_CACHE_KEY = 'extractionCache';

type ExtractionCache = {
  proposalId: string;
  chatHash: string;  // チャット履歴のハッシュ
  extractedAt: number;
};

// シンプルなハッシュ関数（チャット履歴の変更検出用）
export const generateChatHash = (messages: Array<{ content: string; role: string }>): string => {
  const content = messages.map(m => `${m.role}:${m.content}`).join('|');
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const getExtractionCache = (proposalId: string): ExtractionCache | null => {
  if (typeof window === 'undefined') return null;

  const data = localStorage.getItem(EXTRACTION_CACHE_KEY);
  if (!data) return null;

  const caches: ExtractionCache[] = JSON.parse(data);
  return caches.find(c => c.proposalId === proposalId) || null;
};

export const saveExtractionCache = (proposalId: string, chatHash: string): void => {
  if (typeof window === 'undefined') return;

  const data = localStorage.getItem(EXTRACTION_CACHE_KEY);
  const caches: ExtractionCache[] = data ? JSON.parse(data) : [];

  const index = caches.findIndex(c => c.proposalId === proposalId);
  const newCache: ExtractionCache = {
    proposalId,
    chatHash,
    extractedAt: Date.now(),
  };

  if (index >= 0) {
    caches[index] = newCache;
  } else {
    caches.push(newCache);
  }

  localStorage.setItem(EXTRACTION_CACHE_KEY, JSON.stringify(caches));
};

// outlineが有効かどうかをチェック（空でない内容があるか）
export const isOutlineValid = (proposal: Proposal): boolean => {
  const { outline } = proposal;
  if (!outline) return false;

  // 何かしらの内容があればtrue
  return !!(
    outline.currentRecognition?.background ||
    outline.currentRecognition?.currentProblems?.length > 0 ||
    outline.currentRecognition?.rootCauseHypothesis?.length > 0 ||
    outline.issueSetting?.criticalIssues?.length > 0 ||
    outline.toBeVision?.vision ||
    outline.toBeVision?.goals?.length > 0 ||
    outline.approach?.overview ||
    outline.approach?.steps?.length > 0
  );
};

// スライド生成キャッシュ操作（outlineのハッシュを保存）

const SLIDE_GENERATION_CACHE_KEY = 'slideGenerationCache';

type SlideGenerationCache = {
  proposalId: string;
  outlineHash: string;  // outlineのハッシュ
  generatedAt: number;
};

// outlineからハッシュを生成
export const generateOutlineHash = (outline: Proposal['outline']): string => {
  const content = JSON.stringify(outline);
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const getSlideGenerationCache = (proposalId: string): SlideGenerationCache | null => {
  if (typeof window === 'undefined') return null;

  const data = localStorage.getItem(SLIDE_GENERATION_CACHE_KEY);
  if (!data) return null;

  const caches: SlideGenerationCache[] = JSON.parse(data);
  return caches.find(c => c.proposalId === proposalId) || null;
};

export const saveSlideGenerationCache = (proposalId: string, outlineHash: string): void => {
  if (typeof window === 'undefined') return;

  const data = localStorage.getItem(SLIDE_GENERATION_CACHE_KEY);
  const caches: SlideGenerationCache[] = data ? JSON.parse(data) : [];

  const index = caches.findIndex(c => c.proposalId === proposalId);
  const newCache: SlideGenerationCache = {
    proposalId,
    outlineHash,
    generatedAt: Date.now(),
  };

  if (index >= 0) {
    caches[index] = newCache;
  } else {
    caches.push(newCache);
  }

  localStorage.setItem(SLIDE_GENERATION_CACHE_KEY, JSON.stringify(caches));
};

// slidesが有効かどうかをチェック（visualIntentが設定されているか）
export const areSlidesValid = (proposal: Proposal): boolean => {
  const { slides } = proposal;
  if (!slides || slides.length === 0) return false;

  // 全てのスライドにvisualIntentが設定されていればtrue
  return slides.every(slide => !!slide.visualIntent);
};
