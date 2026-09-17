export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead';

export type QuestionType = 'technical' | 'behavioral' | 'situational';

export type InterviewStatus = 'in_progress' | 'completed' | 'abandoned';

export interface SkillExtractionResult {
  required_skills: string[];
  nice_to_have_skills: string[];
  seniority_level: SeniorityLevel;
  key_focus_areas: string[];
}

export interface QuestionGenerationResult {
  question: string;
  question_type: QuestionType;
  targets_skill: string;
}

export interface AnswerEvaluationResult {
  score: number; // 0 - 10
  strengths: string[];
  gaps: string[];
  feedback: string;
}

export interface SkillScoreBreakdown {
  skill: string;
  score: number; // 0 - 100
  notes: string;
}

export interface FinalReportData {
  overall_score: number; // 0 - 100
  summary: string;
  top_strengths: string[];
  key_gaps: string[];
  recommendation: string;
  per_skill_breakdown: SkillScoreBreakdown[];
}

export interface InterviewQuestion {
  id: string;
  interview_id: string;
  question_number: number;
  question_text: string;
  question_type?: QuestionType;
  targets_skill?: string;
  answer_text?: string | null;
  answer_audio_path?: string | null;
  score?: number | null;
  evaluation?: AnswerEvaluationResult | null;
  created_at: string;
}

export interface Interview {
  id: string;
  user_id: string;
  job_role: string;
  resume_path?: string | null;
  jd_path?: string | null;
  jd_text?: string | null;
  extracted_skills?: SkillExtractionResult | null;
  status: InterviewStatus;
  overall_score?: number | null;
  report?: FinalReportData | null;
  target_questions?: number;
  created_at: string;
  completed_at?: string | null;
  questions?: InterviewQuestion[];
}
