function testCaseAttempts(nodes, parentTest) {
  return nodes.flatMap(node => {
    const test = node.nodeType === 'Test Case'
      ? {name: node.name, identifier: node.nodeIdentifier ?? node.nodeIdentifierURL ?? node.name}
      : parentTest;
    const repetitions = (node.children ?? []).some(child => child.nodeType === 'Repetition');
    const isAttempt = node.nodeType === 'Repetition' || (node.nodeType === 'Test Case' && !repetitions);
    return [
      ...(isAttempt
        ? [{
            attempt: node.nodeType === 'Repetition' ? node.name : 'Only run',
            identifier: test?.identifier ?? '<unknown>',
            name: test?.name ?? '<unknown>',
            result: node.result ?? 'Unknown',
          }]
        : []),
      ...testCaseAttempts(node.children ?? [], test),
    ];
  });
}

export function retryTelemetry(testReport, buildOutput) {
  const attempts = testCaseAttempts(testReport?.testNodes ?? []);
  const byIdentifier = new Map();
  for (const attempt of attempts) {
    const entries = byIdentifier.get(attempt.identifier) ?? [];
    entries.push(attempt.result);
    byIdentifier.set(attempt.identifier, entries);
  }
  const recoveredTests = [...byIdentifier.entries()]
    .filter(([, results]) => results.includes('Failed') && results.at(-1) === 'Passed')
    .map(([identifier, results]) => ({identifier, results}));
  return {
    attempts,
    maxAttempts: 2,
    policy: 'xcode-retry-tests-on-failure',
    recoveredTests,
    retryLog: buildOutput.split('\n').filter(line => /retry|repetition/i.test(line)).map(line => line.trim()).filter(Boolean),
  };
}
