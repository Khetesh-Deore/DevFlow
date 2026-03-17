import { useContestStore } from '@/store/contestStore';
import { Terminal, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TestcaseViewer, { type TestcaseResult } from '@/components/TestcaseViewer';

const verdictConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  '✓ Accepted': { icon: CheckCircle, color: 'text-success', label: 'Accepted' },
  '✓ Sample test case passed': { icon: CheckCircle, color: 'text-success', label: 'Tests Passed' },
  'Wrong Answer': { icon: XCircle, color: 'text-destructive', label: 'Wrong Answer' },
  'Time Limit Exceeded': { icon: Clock, color: 'text-warning', label: 'TLE' },
  'Runtime Error': { icon: AlertTriangle, color: 'text-warning', label: 'Runtime Error' },
};

const getVerdict = (output: string) => {
  for (const key of Object.keys(verdictConfig)) {
    if (output.startsWith(key)) return verdictConfig[key];
  }
  return null;
};

// Mock testcase results — would come from backend
const mockTestcases: TestcaseResult[] = [
  { id: 1, passed: true, input: '2 7 11 15\n9', expectedOutput: '0 1', userOutput: '0 1', runtime: '2ms' },
  { id: 2, passed: true, input: '3 2 4\n6', expectedOutput: '1 2', userOutput: '1 2', runtime: '1ms' },
  { id: 3, passed: false, input: '3 3\n6', expectedOutput: '0 1', userOutput: '0 0', runtime: '1ms' },
];

const OutputPanel = () => {
  const { output, isRunning } = useContestStore();
  const verdict = output ? getVerdict(output) : null;
  const showTestcases = output && !isRunning;

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-accent/50">
        <Terminal className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Output</span>
        <AnimatePresence mode="wait">
          {isRunning && (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="ml-auto flex items-center gap-1.5"
            >
              <div className="h-2 w-2 rounded-full bg-info animate-pulse" />
              <span className="text-xs text-info font-medium">Running...</span>
            </motion.div>
          )}
          {!isRunning && verdict && (
            <motion.div
              key="verdict"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`ml-auto flex items-center gap-1.5 ${verdict.color}`}
            >
              <verdict.icon className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">{verdict.label}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 space-y-4 max-h-[300px] overflow-auto">
        <AnimatePresence mode="wait">
          <motion.pre
            key={output || 'empty'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-mono text-foreground whitespace-pre-wrap"
          >
            {output || 'Run or submit your code to see output here...'}
          </motion.pre>
        </AnimatePresence>

        {showTestcases && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <TestcaseViewer testcases={mockTestcases} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
