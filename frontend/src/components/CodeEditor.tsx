import { useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useContestStore } from '@/store/contestStore';
import { useThemeStore } from '@/store/themeStore';
import { defaultCodeTemplates } from '@/utils/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Play, Send, RotateCcw, Keyboard } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const languages = [
  { value: 'cpp', label: 'C++', monacoLang: 'cpp' },
  { value: 'c', label: 'C', monacoLang: 'c' },
  { value: 'java', label: 'Java', monacoLang: 'java' },
  { value: 'python', label: 'Python', monacoLang: 'python' },
  { value: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
];

const CodeEditor = () => {
  const { code, setCode, selectedLanguage, setSelectedLanguage, isRunning, setIsRunning, setOutput } = useContestStore();
  const { theme } = useThemeStore();

  const currentLang = languages.find(l => l.value === selectedLanguage);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setCode(defaultCodeTemplates[lang] || '');
  };

  const handleRun = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('Running...');
    setTimeout(() => {
      setOutput('✓ Sample test case passed\n\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExpected: [0,1]\n\nExecution time: 4ms\nMemory: 8.2MB');
      setIsRunning(false);
    }, 1500);
  }, [isRunning, setIsRunning, setOutput]);

  const handleSubmit = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('Submitting...');
    setTimeout(() => {
      setOutput('✓ Accepted\n\nAll test cases passed (15/15)\n\nExecution time: 4ms\nMemory: 8.2MB');
      setIsRunning(false);
    }, 2000);
  }, [isRunning, setIsRunning, setOutput]);

  const handleReset = () => {
    setCode(defaultCodeTemplates[selectedLanguage] || '');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, handleSubmit]);

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-accent/50">
        <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-36 h-8 text-xs bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map(l => (
              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground h-8 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleRun} disabled={isRunning} className="h-8 text-xs">
                <Play className="h-3 w-3 mr-1" /> Run
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <span className="flex items-center gap-1"><Keyboard className="h-3 w-3" /> Ctrl + Enter</span>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={handleSubmit} disabled={isRunning} className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                <Send className="h-3 w-3 mr-1" /> Submit
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <span className="flex items-center gap-1"><Keyboard className="h-3 w-3" /> Ctrl + Shift + Enter</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={currentLang?.monacoLang || 'cpp'}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            lineNumbers: 'on',
            automaticLayout: true,
            tabSize: 4,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
