
export interface QuestionnaireUpdate {
  manualScore: number;
  comment: {
    text: string;
  };
  adminId: string;
}