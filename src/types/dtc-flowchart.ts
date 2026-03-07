export interface LiveDtcFlowStep {
  step: number;
  title: string;
  question?: string;
  yesAction?: string;
  noAction?: string;
  details: string[];
}

export interface LiveDtcFlowchart {
  code: string;
  heading?: string;
  sourcePath: string;
  sourceUrl: string;
  sourceVehicle: string;
  whenMonitored?: string;
  setCondition?: string;
  possibleCauses: string[];
  steps: LiveDtcFlowStep[];
}
