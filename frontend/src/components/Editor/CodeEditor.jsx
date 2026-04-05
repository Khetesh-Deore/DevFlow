import Editor from '@monaco-editor/react';

const LANG_MAP = {
  python: 'python',
  cpp: 'cpp',
  c: 'c',
  java: 'java',
  javascript: 'javascript'
};

export const DEFAULT_TEMPLATES = {
  python: `import sys
input = sys.stdin.readline

def solve():
    pass

solve()
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // your code here
    return 0;
}
`,
  c: `#include <stdio.h>

int main() {
    // your code here
    return 0;
}
`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner sc = new Scanner(System.in);
        // your code here
    }
}
`,
  javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n');
let idx = 0;
// your code here
`
};

export default function CodeEditor({
  value,
  onChange,
  language = 'python',
  readOnly = false,
  height = '500px'
}) {
  return (
    <Editor
      height={height}
      language={LANG_MAP[language] || 'python'}
      value={value}
      onChange={(val) => onChange(val ?? '')}
      theme="vs-dark"
      loading={
        <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400 text-sm">
          Loading editor...
        </div>
      }
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        lineNumbers: 'on',
        wordWrap: 'off',
        readOnly,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        tabSize: 4,
        bracketPairColorization: { enabled: true },
        padding: { top: 12 }
      }}
    />
  );
}
