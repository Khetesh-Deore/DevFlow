import { Badge } from '@/components/ui/badge';
import type { Submission } from '@/store/contestStore';

interface SubmissionTableProps {
  submissions: Submission[];
}

const verdictStyles: Record<string, string> = {
  AC: 'bg-success/10 text-success border-success/20',
  WA: 'bg-destructive/10 text-destructive border-destructive/20',
  TLE: 'bg-warning/10 text-warning border-warning/20',
  RE: 'bg-destructive/10 text-destructive border-destructive/20',
  CE: 'bg-destructive/10 text-destructive border-destructive/20',
  Pending: 'bg-info/10 text-info border-info/20',
};

const verdictLabels: Record<string, string> = {
  AC: 'Accepted',
  WA: 'Wrong Answer',
  TLE: 'Time Limit',
  RE: 'Runtime Error',
  CE: 'Compile Error',
  Pending: 'Pending',
};

const SubmissionTable = ({ submissions }: SubmissionTableProps) => {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Problem</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Verdict</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Language</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Runtime</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Memory</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3 text-foreground font-medium">{sub.problemTitle}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={verdictStyles[sub.verdict]}>
                    {verdictLabels[sub.verdict]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{sub.language}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{sub.runtime}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{sub.memory}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(sub.submittedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {submissions.map((sub) => (
          <div key={sub.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground text-sm">{sub.problemTitle}</span>
              <Badge variant="outline" className={verdictStyles[sub.verdict]}>
                {verdictLabels[sub.verdict]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{sub.language}</span>
              <span className="font-mono">{sub.runtime}</span>
              <span className="font-mono">{sub.memory}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(sub.submittedAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default SubmissionTable;
