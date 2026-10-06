export type TestNode = {
  children?: TestNode[];
  name: string;
  nodeIdentifier?: string;
  nodeIdentifierURL?: string;
  nodeType: string;
  result?: string;
};

export function retryTelemetry(report: {testNodes?: TestNode[]}, output: string): {
  attempts: {attempt: string; identifier: string; name: string; result: string}[];
  maxAttempts: number;
  policy: string;
  recoveredTests: {identifier: string; results: string[]}[];
  retryLog: string[];
};
