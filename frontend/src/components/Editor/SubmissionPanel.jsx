import { Loader2, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';

const STATUS_CONFIG = {
  accepted:             { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', icon: <CheckCircle2 size={18} />, label: 'Accepted' },
  wrong_answer:         { color: 'text-red-400',   bg: 'bg-red-400/10 border-red-400/30',     icon: <XCircle size={18} />,     label: 'Wrong Answer' },
  time_limit_exceeded:  { color: 'text-orange-400',bg: 'bg-orange-400/10 border-orange-400/30',icon: <Clock size={18} />,       label: 'Time Limit Exceeded' },
  runtime_error:        { color: 'text-red-400',   bg: 'bg-red-400/10 border-red-400/30',     icon: <XCircle size={18} />,     label: 'Runtime Error' },
  compilation_error:    { color: 'text-red-400',   bg: 'bg-red-400/10 border-red-400/30',     icon: <XCircle size={18} />,     label: 'Compilation Error' },
  memory_limit_exceeded:{ color: 'text-orange-400',bg: 'bg-orange-400/10 border-orange-400/30',icon: <Zap size={18} />,         label: 'Memory Limit Exceeded' }
};

function ProgressBar({ passed, total }) {
  const pct = total > 0 ? (passed / total) * 100 : 0;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{passed} / {total} test cases passed</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CodeBlock({ children }) {
  return (
    <pre className="bg-gray-800 rounded-lg p-3 text-xs font-mono text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
      {children || '(empty)'}
    </pre>
  );
}

export default function SubmissionPanel({ submission, isLoading }) {
  if (!submission && !isLoading) return null;

  const isJudging = isLoading || submission?.status === 'pending' || submission?.status === 'running';

  if (isJudging) {
    return (
      <div className="border-t border-gray-800 bg-gray-900 p-5">
        <div className="flex items-center gap-3 text-blue-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-medium">Judging your code...</span>
          <span className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        </div>
      </div>
    );
  }

  const { status, passedTestCases, totalTestCases, testCaseResults = [], compileError, timeTakenMs } = submission;
  const cfg = STATUS_CONFIG[status] || { color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700', icon: null, label: status };

  const firstFail = testCaseResults.find(r => r.status !== 'accepted');
  const failCount = testCaseResults.filter(r => r.status !== 'accepted').length;
  const maxTime = testCaseResults.length ? Math.max(...testCaseResults.map(r => r.timeTakenMs || 0)) : timeTakenMs;

  return (
    <div className="border-t border-gray-800 bg-gray-900 p-5">

      {/* Status Header */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${cfg.bg} mb-4 w-fit`}>
        <span className={cfg.color}>{cfg.icon}</span>
        <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
      </div>

      {/* Compilation Error */}
      {status === 'compilation_error' && compileError && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Compiler output:</p>
          <CodeBlock>{compileError}</CodeBlock>
        </div>
      )}

      {/* Accepted */}
      {status === 'accepted' && (
        <div>
          {totalTestCases > 0 && <ProgressBar passed={passedTestCases} total={totalTestCases} />}
          {totalTestCases === 0 && (
            <p className="text-xs text-green-400 mt-1">All test cases passed</p>
          )}
          {maxTime > 0 && (
            <p className="text-xs text-gray-500 mt-2">Runtime: {maxTime}ms</p>
          )}
        </div>
      )}

      {/* Wrong Answer */}
      {status === 'wrong_answer' && (
        <div>
          <ProgressBar passed={passedTestCases} total={totalTestCases} />
          {firstFail && (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-xs text-gray-400 font-medium">First failing test case:</p>
              <div>
                <p className="text-xs text-gray-500 mb-1">Input</p>
                <CodeBlock>{firstFail.stdout !== undefined ? firstFail.expected?.split('\n')[0] : ''}</CodeBlock>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expected Output</p>
                  <CodeBlock>{firstFail.expected}</CodeBlock>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Your Output</p>
                  <CodeBlock>{firstFail.got}</CodeBlock>
                </div>
              </div>
              {failCount > 1 && (
                <p className="text-xs text-gray-500">{failCount - 1} more test case{failCount > 2 ? 's' : ''} failed</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TLE */}
      {status === 'time_limit_exceeded' && (
        <div>
          <ProgressBar passed={passedTestCases} total={totalTestCases} />
          <p className="text-xs text-orange-400 mt-3">Your code exceeded the time limit.</p>
        </div>
      )}

      {/* Runtime Error */}
      {status === 'runtime_error' && (
        <div>
          <ProgressBar passed={passedTestCases} total={totalTestCases} />
          {firstFail?.stderr && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1">Error output:</p>
              <CodeBlock>{firstFail.stderr}</CodeBlock>
            </div>
          )}
        </div>
      )}

      {/* Memory Limit */}
      {status === 'memory_limit_exceeded' && (
        <div>
          <ProgressBar passed={passedTestCases} total={totalTestCases} />
          <p className="text-xs text-orange-400 mt-3">Your code exceeded the memory limit.</p>
        </div>
      )}

    </div>
  );
}
