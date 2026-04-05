import useEditorStore from '../../store/editorStore';
import { VERDICT_COLORS } from '../../utils/constants';

export default function SubmissionResult() {
  const { submissionResult } = useEditorStore();
  if (!submissionResult) return null;

  const { status, passedTestCases, totalTestCases, testCaseResults } = submissionResult;

  return (
    <div className="p-4 bg-gray-900 border-t border-gray-700 text-sm">
      <div className={`text-lg font-semibold mb-2 ${VERDICT_COLORS[status] || 'text-white'}`}>
        {status?.replace(/_/g, ' ').toUpperCase()}
      </div>
      {totalTestCases > 0 && (
        <div className="text-gray-400 mb-3">{passedTestCases}/{totalTestCases} test cases passed</div>
      )}
      {testCaseResults?.slice(0, 3).map((tc, i) => (
        <div key={i} className="mb-2 p-2 bg-gray-800 rounded">
          <span className={`text-xs font-medium ${VERDICT_COLORS[tc.status]}`}>
            Test {i + 1}: {tc.status}
          </span>
          {tc.errorMessage && <pre className="text-red-400 text-xs mt-1">{tc.errorMessage}</pre>}
        </div>
      ))}
    </div>
  );
}
