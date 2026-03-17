import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { mockContests } from '@/utils/mockData';
import { useContestStore } from '@/store/contestStore';
import ProblemViewer from '@/components/ProblemViewer';
import CodeEditor from '@/components/CodeEditor';
import OutputPanel from '@/components/OutputPanel';
import ContestTimer from '@/components/ContestTimer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { List, FileText, Code, Terminal, ChevronDown, ChevronUp, PanelLeftClose, PanelLeftOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const difficultyStyles: Record<string, string> = {
  Easy: 'text-success',
  Medium: 'text-warning',
  Hard: 'text-destructive',
};

type MobileTab = 'problems' | 'description' | 'editor' | 'output';

const ContestArenaPage = () => {
  const { contestId } = useParams();
  const contest = mockContests.find(c => c.id === contestId) || mockContests[1];
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
  const selectedProblem = contest.problems[selectedProblemIndex];
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [outputExpanded, setOutputExpanded] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('description');
  const { output } = useContestStore();
  // Mock solved problems (would come from backend)
  const solvedProblems = new Set(['1']);
  const endTime = new Date(new Date(contest.startTime).getTime() + contest.duration * 60000).toISOString();

  const mobileTabs: { id: MobileTab; label: string; icon: typeof List }[] = [
    { id: 'problems', label: 'Problems', icon: List },
    { id: 'description', label: 'Problem', icon: FileText },
    { id: 'editor', label: 'Code', icon: Code },
    { id: 'output', label: 'Output', icon: Terminal },
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Arena header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-border bg-card/80 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <h2 className="text-xs md:text-sm font-semibold text-foreground truncate">{contest.title}</h2>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs shrink-0 hidden sm:inline-flex">Live</Badge>
        </div>
        <ContestTimer endTime={endTime} />
      </div>

      {/* Mobile tab bar */}
      <div className="flex md:hidden border-b border-border bg-card/50">
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2',
              mobileTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* === MOBILE LAYOUT === */}
      <div className="flex-1 flex flex-col min-h-0 md:hidden">
        {mobileTab === 'problems' && (
          <div className="flex-1 overflow-auto p-3 animate-fade-in">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Problems</h3>
            <div className="space-y-1.5">
              {contest.problems.map((problem, i) => (
                <button
                  key={problem.id}
                  onClick={() => { setSelectedProblemIndex(i); setMobileTab('description'); }}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg text-sm transition-colors',
                    i === selectedProblemIndex
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {solvedProblems.has(problem.id) && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
                      <span>{problem.title}</span>
                    </div>
                    <span className={`text-xs font-medium ${difficultyStyles[problem.difficulty]}`}>{problem.difficulty}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {mobileTab === 'description' && (
          <div className="flex-1 overflow-auto p-3 animate-fade-in">
            <ProblemViewer problem={selectedProblem} />
          </div>
        )}
        {mobileTab === 'editor' && (
          <div className="flex-1 p-3 min-h-0 animate-fade-in">
            <CodeEditor />
          </div>
        )}
        {mobileTab === 'output' && (
          <div className="flex-1 p-3 animate-fade-in">
            <OutputPanel />
          </div>
        )}
      </div>

      {/* === DESKTOP / TABLET LAYOUT === */}
      <div className="hidden md:flex flex-1 min-h-0">
        {/* Problem list sidebar - collapsible */}
        <div
          className={cn(
            'border-r border-border bg-card/50 overflow-auto shrink-0 transition-all duration-300',
            sidebarOpen ? 'w-48 lg:w-56' : 'w-0 overflow-hidden border-r-0'
          )}
        >
          <div className="p-3 min-w-[11rem]">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Problems</h3>
            <div className="space-y-1">
              {contest.problems.map((problem, i) => (
                <button
                  key={problem.id}
                  onClick={() => setSelectedProblemIndex(i)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                    i === selectedProblemIndex
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {solvedProblems.has(problem.id) && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
                      <span className="truncate">{problem.title}</span>
                    </div>
                  </div>
                  <span className={`text-xs ${difficultyStyles[problem.difficulty]}`}>{problem.difficulty}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex min-h-0">
            <div className="w-1/2 overflow-auto p-3">
              <ProblemViewer problem={selectedProblem} />
            </div>
            <div className="w-1/2 p-3 min-h-0">
              <CodeEditor />
            </div>
          </div>

          {/* Output panel - collapsible */}
          <div className="p-3 pt-0">
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <button
                onClick={() => setOutputExpanded(!outputExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 bg-accent/50 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Output</span>
                </div>
                {outputExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              {outputExpanded && (
                <div className="max-h-[350px] overflow-auto">
                  <OutputPanel />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestArenaPage;
