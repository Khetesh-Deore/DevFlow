import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Problem } from '@/store/contestStore';
import { mockSubmissions } from '@/utils/mockData';

interface ProblemViewerProps {
  problem: Problem;
}

const difficultyStyles: Record<string, string> = {
  Easy: 'bg-success/10 text-success border-success/20',
  Medium: 'bg-warning/10 text-warning border-warning/20',
  Hard: 'bg-destructive/10 text-destructive border-destructive/20',
};

const verdictStyles: Record<string, string> = {
  AC: 'text-success',
  WA: 'text-destructive',
  TLE: 'text-warning',
  RE: 'text-destructive',
};

const ProblemViewer = ({ problem }: ProblemViewerProps) => {
  const problemSubmissions = mockSubmissions.filter(s => s.problemId === problem.id);

  return (
    <div className="h-full overflow-auto bg-card border border-border rounded-lg">
      <Tabs defaultValue="description" className="h-full flex flex-col">
        <TabsList className="bg-accent/50 border-b border-border rounded-none shrink-0 w-full justify-start px-2">
          <TabsTrigger value="description" className="text-xs">Description</TabsTrigger>
          <TabsTrigger value="submissions" className="text-xs">Submissions</TabsTrigger>
          <TabsTrigger value="discussion" className="text-xs">Discussion</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="flex-1 overflow-auto p-5 mt-0">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">{problem.title}</h2>
            <Badge variant="outline" className={difficultyStyles[problem.difficulty]}>
              {problem.difficulty}
            </Badge>
          </div>

          <div className="text-sm text-foreground/90 whitespace-pre-line mb-6">{problem.description}</div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Constraints</h3>
            <ul className="space-y-1">
              {problem.constraints.map((c, i) => (
                <li key={i} className="text-sm text-muted-foreground font-mono bg-accent/50 px-3 py-1 rounded">
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Sample Input</h3>
              <pre className="bg-accent/50 rounded-md p-3 text-sm font-mono text-foreground overflow-x-auto">{problem.sampleInput}</pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Sample Output</h3>
              <pre className="bg-accent/50 rounded-md p-3 text-sm font-mono text-foreground overflow-x-auto">{problem.sampleOutput}</pre>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="flex-1 overflow-auto p-5 mt-0">
          {problemSubmissions.length > 0 ? (
            <div className="space-y-2">
              {problemSubmissions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${verdictStyles[s.verdict]}`}>{s.verdict}</span>
                    <span className="text-muted-foreground">{s.language}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{s.runtime}</span>
                    <span className="font-mono">{s.memory}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No submissions for this problem yet.</p>
          )}
        </TabsContent>

        <TabsContent value="discussion" className="flex-1 overflow-auto p-5 mt-0">
          <p className="text-sm text-muted-foreground text-center py-8">Discussion will be available once the backend is connected.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProblemViewer;
