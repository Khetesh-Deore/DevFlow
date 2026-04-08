import { useState } from 'react';
import { Check, X, Lock } from 'lucide-react';

const VERDICT_COLORS = {
  accepted: 'text-green-400',
  wrong_answer: 'text-red-400',
  time_limit_exceeded: 'text-orange-400',
  runtime_error: 'text-red-400',
  compilation_error: 'text-red-400',
  pending: 'text-gray-400',
  running: 'text-blue-400'
};

export default function SubmissionPanel({ submission, isLoading }) {
  const [selectedCase, setSelectedCase] = useState(0);

  if (isLoading || !submission) {
    return (
      <div className="flex items-center gap-2 text-blue-400 py-4">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Judging...</span>
      </div>
    );
  }

  const { status, passedTestCases, totalTestCases, testCaseResults = [], timeTakenMs, compileError } = submission;

  if (compileError) {
    return (
      <div className="p-4">
        <div className="text-red-400 text-lg font-semibold mb-2">Compilation Error</div>
        <pre className="bg-gray-800 rounded p-3 text-xs font-mono text-red-400 whitespace-pre-wrap overflow-x-auto">
          {compileError}
        </pre>
      </div>
    );
  }

  const selectedResult = testCaseResults[selectedCase];
  const isSampleCase = selectedResult?.isSample;

  return (
    <div className="flex flex-col h-full">
      {/* Verdict header */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-800">
        <div className={`text-xl font-bold mb-1 ${VERDICT_COLORS[status] || 'text-white'}`}>
          {status?.replace(/_/g, ' ')}
        </div>
        <div className="text-sm text-gray-400">Runtime: {timeTakenMs || 0} ms</div>
      </div>

      {/* Test case tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-gray-800 overflow-x-auto">
        {testCaseResults.map((tc, i) => (
          <button
            key={i}
            onClick={() => setSelectedCase(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              selectedCase === i
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white'
            }`}
          >
            {tc.status === 'accepted' ? (
              <Check size={12} className="text-green-400" />
            ) : (
              <X size={12} className="text-red-400" />
            )}
            Case {i + 1}
          </button>
        ))}
      </div>

      {/* Selected test case details */}
      {selectedResult && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isSampleCase ? (
            <>
              <div>
                <div className="text-xs text-gray-500 mb-1.5">Input</div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <pre className="text-sm font-mono text-white whitespace-pre-wrap">
                    {selectedResult.input || ''}
                  </pre>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1.5">Output</div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <pre className="text-sm font-mono text-white whitespace-pre-wrap">
                    {selectedResult.got || selectedResult.stdout || ''}
                  </pre>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1.5">Expected</div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <pre className="text-sm font-mono text-white whitespace-pre-wrap">
                    {selectedResult.expected || ''}
                  </pre>
                </div>
              </div>

              {selectedResult.stderr && (
                <div>
                  <div className="text-xs text-red-400 mb-1.5">Error</div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap">
                      {selectedResult.stderr}
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lock size={32} className="text-gray-600 mb-3" />
              <div className="text-sm text-gray-400 mb-1">Hidden Test Case</div>
              <div className={`text-xs font-medium ${selectedResult.status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>
                {selectedResult.status === 'accepted' ? '✓ Passed' : '✗ Failed'}
              </div>
              {selectedResult.stderr && (
                <div className="mt-4 w-full">
                  <div className="text-xs text-red-400 mb-1.5">Error</div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap">
                      {selectedResult.stderr}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
