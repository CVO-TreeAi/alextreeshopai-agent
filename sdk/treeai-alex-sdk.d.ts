/**
 * TreeAI Alex SDK - TypeScript Definitions
 */

export interface AlexOptions {
  apiUrl?: string;
  projectName?: string;
  sessionId?: string;
  timeout?: number;
}

export interface ChatOptions {
  sessionId?: string;
  projectId?: string;
  userId?: string;
}

export interface TreeMeasurements {
  height: number;
  crownRadius: number;
  dbh: number;
  species?: string;
}

export interface ProposalData {
  customer: string;
  treeScore?: number;
  location: string;
  services?: string[];
}

export interface WorkOrderData {
  customer: string;
  date: string;
  services: string;
  crewSize?: number;
}

export interface InvoiceData {
  customer: string;
  amount: number;
  description: string;
  projectId?: string;
}

export interface DroneSurveyData {
  treeCount: number;
  averageHeight: number;
  riskTrees: number;
  coordinates: string;
}

export interface ISAAssessmentData {
  studentId: string;
  answers: Record<string, any>;
  practicalScore: number;
  topic: string;
}

export interface EquipmentData {
  equipmentId: string;
  hoursUsed: number;
  lastService: string;
  model: string;
}

export interface RiskAssessmentData {
  location: string;
  treeData: Record<string, any>;
  environmentalFactors: string;
  accessChallenges: string;
}

export interface AlexIntent {
  name: string;
  confidence: number;
}

export interface AlexResponseData {
  response: string;
  intent: AlexIntent;
  sessionId: string;
  timestamp: number;
  entities?: Record<string, any>;
}

export declare class AlexResponse {
  raw: AlexResponseData;
  response: string;
  intent: AlexIntent;
  sessionId: string;
  timestamp: number;
  entities: Record<string, any>;

  constructor(data: AlexResponseData);
  getText(): string;
  getIntent(): string;
  getConfidence(): number;
  getEntities(): Record<string, any>;
  contains(keyword: string): boolean;
  extractNumbers(): string[];
  needsMoreInfo(): boolean;
  getRaw(): AlexResponseData;
}

export declare class AlexError extends Error {
  originalError?: Error;
  constructor(message: string, originalError?: Error);
}

export declare class TreeAIAlex {
  apiUrl: string;
  projectName: string;
  sessionId: string;
  timeout: number;

  constructor(options?: AlexOptions);

  // Core Methods
  chat(message: string, options?: ChatOptions): Promise<AlexResponse>;
  healthCheck(): Promise<boolean>;
  resetSession(): string;
  getHistory(): Promise<any[]>;

  // TreeShop Operations
  createLead(customerInfo: string): Promise<AlexResponse>;
  calculateTreeScore(measurements: TreeMeasurements): Promise<AlexResponse>;
  generateProposal(project: ProposalData): Promise<AlexResponse>;
  scheduleWork(workOrder: WorkOrderData): Promise<AlexResponse>;
  getAnalytics(timeframe?: string): Promise<AlexResponse>;
  createInvoice(invoice: InvoiceData): Promise<AlexResponse>;

  // Specialized TreeAI Integrations
  analyzeDroneSurvey(droneData: DroneSurveyData): Promise<AlexResponse>;
  assessISAStudent(assessment: ISAAssessmentData): Promise<AlexResponse>;
  predictMaintenance(equipment: EquipmentData): Promise<AlexResponse>;
  assessRisk(riskData: RiskAssessmentData): Promise<AlexResponse>;

  // Utility Methods
  private generateSessionId(): string;
}