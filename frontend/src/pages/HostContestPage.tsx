import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, ExternalLink, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProblemEntry {
  url: string;
  platform: string;
}

const HostContestPage = () => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('120');
  const [problems, setProblems] = useState<ProblemEntry[]>([{ url: '', platform: 'leetcode' }]);

  const addProblem = () => setProblems([...problems, { url: '', platform: 'leetcode' }]);
  const removeProblem = (i: number) => setProblems(problems.filter((_, idx) => idx !== i));
  const updateProblem = (i: number, field: keyof ProblemEntry, value: string) => {
    const updated = [...problems];
    updated[i] = { ...updated[i], [field]: value };
    setProblems(updated);
  };

  const steps = ['Details', 'Problems', 'Solutions', 'Review'];

  return (
    <PageTransition>
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Host a Contest</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-1 sm:gap-2 mb-6 md:mb-8 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setStep(i + 1)}
              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i + 1 === step ? 'bg-primary text-primary-foreground' :
                i + 1 < step ? 'bg-primary/20 text-primary' :
                'bg-accent text-muted-foreground'
              }`}
            >
              {i + 1 < step ? <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : i + 1}
            </button>
            <span className="text-xs text-muted-foreground hidden sm:inline">{s}</span>
            {i < steps.length - 1 && <div className="w-4 sm:w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
      {/* Step 1 */}
      {step === 1 && (
        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
        <div className="space-y-4 bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="space-y-2">
            <Label className="text-foreground">Contest Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekly Challenge #13" className="bg-accent border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the contest..." className="bg-accent border-border min-h-[100px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Start Time</Label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-accent border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Duration (minutes)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-accent border-border" />
            </div>
          </div>
          <Button onClick={() => setStep(2)} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
            Next: Add Problems
          </Button>
        </div>
        </motion.div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
        <div className="space-y-4 bg-card border border-border rounded-lg p-4 md:p-6">
          <p className="text-sm text-muted-foreground mb-4">Paste problem URLs from supported platforms.</p>
          {problems.map((problem, i) => (
            <div key={i} className="space-y-2">
              <Label className="text-foreground text-sm">Problem URL #{i + 1}</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3">
                <Input value={problem.url} onChange={(e) => updateProblem(i, 'url', e.target.value)} placeholder="https://leetcode.com/problems/two-sum" className="bg-accent border-border flex-1" />
                <div className="flex gap-2">
                  <Select value={problem.platform} onValueChange={(v) => updateProblem(i, 'platform', v)}>
                    <SelectTrigger className="w-full sm:w-36 bg-accent border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leetcode">LeetCode</SelectItem>
                      <SelectItem value="codeforces">Codeforces</SelectItem>
                      <SelectItem value="gfg">GeeksforGeeks</SelectItem>
                      <SelectItem value="hackerrank">HackerRank</SelectItem>
                    </SelectContent>
                  </Select>
                  {problems.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeProblem(i)} className="text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addProblem} className="text-sm">
            <PlusCircle className="h-4 w-4 mr-2" /> Add Problem
          </Button>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)} className="bg-primary text-primary-foreground hover:bg-primary/90">Next: Solutions</Button>
          </div>
        </div>
        </motion.div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
        <div className="space-y-4 bg-card border border-border rounded-lg p-4 md:p-6">
          <p className="text-sm text-muted-foreground">
            Reference solutions and testcases will be generated after the backend is connected.
          </p>
          <div className="p-6 md:p-8 border border-dashed border-border rounded-lg text-center">
            <ExternalLink className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Solution and testcase generation will be available once the backend API is connected.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={() => setStep(4)} className="bg-primary text-primary-foreground hover:bg-primary/90">Next: Review</Button>
          </div>
        </div>
        </motion.div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
        <div className="space-y-4 bg-card border border-border rounded-lg p-4 md:p-6">
          <h3 className="font-semibold text-foreground mb-2">Review Contest</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Title</span>
              <span className="text-foreground font-medium truncate ml-4">{title || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Duration</span>
              <span className="text-foreground">{duration} min</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Problems</span>
              <span className="text-foreground">{problems.filter(p => p.url).length}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Start Time</span>
              <span className="text-foreground truncate ml-4">{startTime || '—'}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Publish Contest
            </Button>
          </div>
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
    </PageTransition>
  );
};

export default HostContestPage;
