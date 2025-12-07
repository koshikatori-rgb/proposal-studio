// プロジェクト全体
export type Proposal = {
  id: string;
  title: string;
  clientName: string;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'in_progress' | 'completed';
  outline: Outline;
  slides: SlideElement[];
  settings: ProposalSettings;
};

// 骨子データ
export type Outline = {
  currentRecognition: CurrentRecognition;
  issueSetting: IssueSetting;
  toBeVision: ToBeVision;
  approach: Approach;
};

// 現状認識
export type CurrentRecognition = {
  industry?: string;
  companyOverview?: string;
  background: string;
  backgroundLayer: 'industry' | 'company' | 'division' | 'department';
  currentProblems: string[];
  rootCauseHypothesis: string[];
};

// 課題仮説
export type IssueSetting = {
  criticalIssues: string[];
  issueTree?: IssueTreeNode;
};

export type IssueTreeNode = {
  id: string;
  label: string;
  children?: IssueTreeNode[];
};

// ToBe像
export type ToBeVision = {
  vision: string;
  goals: string[];
  projectScope: string;
};

// アプローチ
export type Approach = {
  overview: string;
  methodology: string;
  steps: ApproachStep[];
  schedule?: Schedule;
  team?: Team;
};

export type ApproachStep = {
  id: string;
  order: number;
  title: string;
  description: string;
  deliverables: string[];
};

export type Schedule = {
  startDate: string;
  endDate: string;
  weeks: WeekSchedule[];
};

export type WeekSchedule = {
  weekNumber: number;
  stepIds: string[];
};

export type Team = {
  totalHeadcount: number;
  roles: TeamRole[];
};

export type TeamRole = {
  role: string;
  headcount: number;
  manDays: number;
};

// スライド要素
export type SlideElement = {
  id: string;
  type: SlideType;
  order: number;
  title: string;
  mainMessage: string;
  content: SlideContent;
  isRequired: boolean;
};

export type SlideType =
  | 'executive_summary'
  | 'current_recognition'
  | 'issue_setting'
  | 'issue_tree'
  | 'tobe_vision'
  | 'project_goal'
  | 'approach_overview'
  | 'approach_detail'
  | 'why_this_approach'
  | 'schedule'
  | 'team'
  | 'meeting_structure'
  | 'estimate'
  | 'estimate_assumptions'
  | 'project_members'
  | 'appendix';

export type SlideContent = {
  text?: string;
  bullets?: string[];
  table?: TableData;
  diagram?: DiagramData;
};

export type TableData = {
  headers: string[];
  rows: string[][];
};

export type DiagramData = {
  type: 'tree' | 'flow' | 'gantt';
  data: any;
};

// 設定
export type ProposalSettings = {
  template: 'default' | 'custom';
  colors: ColorScheme;
  font: FontSettings;
};

export type ColorScheme = {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
};

export type FontSettings = {
  family: string;
  sizes: {
    title: number;
    heading: number;
    body: number;
  };
};

// AI対話履歴
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type ChatSession = {
  proposalId: string;
  section: 'current_recognition' | 'issue_setting' | 'tobe_vision' | 'approach';
  messages: ChatMessage[];
};
