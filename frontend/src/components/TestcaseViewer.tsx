import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TestcaseResult {
  id: number;
  passed: boolean;
  input: string;
  expectedOutput: string;
  userOutput: string;
  runtime?: string;
}

interface TestcaseViewerProps {
  testcases: TestcaseResult[];
}

const TestcaseViewer = ({ testcases }: TestcaseViewerProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const active = testcases.find((t) => t.id === selected);

  return (
    <div className="space-y-3">
      {/* Testcase pills */}
      <div className="flex flex-wrap gap-2">
        {testcases.map((tc) => (
          <button
            key={tc.id}
            onClick={() => setSelected(selected === tc.id ? null : tc.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border',
              selected === tc.id
                ? 'border-primary bg-primary/10 text-primary'
                : tc.passed
                  ? 'border-success/20 bg-success/5 text-success hover:bg-success/10'
                  : 'border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10'
            )}
          >
            {tc.passed ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            Case #{tc.id}
            <ChevronRight
              className={cn(
                'h-3 w-3 transition-transform',
                selected === tc.id && 'rotate-90'
              )}
            />
          </button>
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border bg-accent/30 p-4 space-y-3">
              {active.runtime && (
                <p className="text-xs text-muted-foreground">
                  Runtime: <span className="font-mono text-foreground">{active.runtime}</span>
                </p>
              )}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Input</h4>
                <pre className="text-sm font-mono text-foreground bg-background/60 rounded-md p-3 overflow-auto max-h-28">
                  {active.input}
                </pre>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Expected Output</h4>
                  <pre className="text-sm font-mono text-success bg-background/60 rounded-md p-3 overflow-auto max-h-28">
                    {active.expectedOutput}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Your Output</h4>
                  <pre
                    className={cn(
                      'text-sm font-mono bg-background/60 rounded-md p-3 overflow-auto max-h-28',
                      active.passed ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {active.userOutput}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestcaseViewer;
