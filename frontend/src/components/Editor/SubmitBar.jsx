import useEditorStore from '../../store/editorStore';
import { submitCode, runCode } from '../../api/submissionApi';

export default function SubmitBar({ problemId, contestId }) {
  const { code, language, isSubmitting, setSubmitting, setResult } = useEditorStore();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await submitCode({ problemId, code, language, contestId });
      setResult(data.submission);
    } catch (err) {
      setResult({ status: 'error', message: err.response?.data?.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRun = async () => {
    setSubmitting(true);
    try {
      const { data } = await runCode({ code, language, input: '' });
      setResult({ status: data.result.status, output: data.result.stdout, error: data.result.stderr });
    } catch (err) {
      setResult({ status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-3 p-3 bg-gray-900 border-t border-gray-700">
      <button onClick={handleRun} disabled={isSubmitting}
        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm">
        Run
      </button>
      <button onClick={handleSubmit} disabled={isSubmitting}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm">
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
}
