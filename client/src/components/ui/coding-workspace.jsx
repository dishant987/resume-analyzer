import { useState, useEffect, useRef } from 'react'
import { Button } from './button'
import { Badge } from './badge'
import { Play, RotateCcw, CheckCircle2, XCircle, Code2, Terminal, AlertCircle, Loader2, Copy, Check, Sparkles } from 'lucide-react'

const BOILERPLATES = {
  javascript: `// Write your JavaScript solution here
function solution(input) {
  // Your code here
  return input;
}
`,
  python: `# Write your Python solution here
def solution(input_val):
    # Your code here
    return input_val
`,
  java: `// Write your Java solution here
public class Solution {
    public static String solve(String input) {
        // Your code here
        return input;
    }
}
`,
  cpp: `// Write your C++ solution here
#include <iostream>
#include <string>

using namespace std;

string solution(string input) {
    // Your code here
    return input;
}
`
}

const MONACO_LANGUAGES = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
}

export function CodingWorkspace({
  question,
  language = 'javascript',
  onLanguageChange,
  onExecuteCode,
  isExecuting = false,
  onSubmitCode,
  isSubmitting = false
}) {
  const [currentLang, setCurrentLang] = useState(language)
  const [code, setCode] = useState(question?.starterCode || BOILERPLATES[language] || BOILERPLATES.javascript)
  const [executionResult, setExecutionResult] = useState(null)
  const [activeTab, setActiveTab] = useState('editor') // 'editor' | 'testcases'
  const [copied, setCopied] = useState(false)
  const [monacoLoaded, setMonacoLoaded] = useState(false)
  const [monacoError, setMonacoError] = useState(false)

  const monacoContainerRef = useRef(null)
  const monacoEditorRef = useRef(null)
  const textareaRef = useRef(null)
  const lineNumbersRef = useRef(null)
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })

  useEffect(() => {
    setCurrentLang(language)
    const initialCode = question?.starterCode || BOILERPLATES[language] || BOILERPLATES.javascript
    setCode(initialCode)
    if (monacoEditorRef.current) {
      monacoEditorRef.current.setValue(initialCode)
      if (window.monaco) {
        const model = monacoEditorRef.current.getModel()
        if (model) {
          window.monaco.editor.setModelLanguage(model, MONACO_LANGUAGES[language] || 'javascript')
        }
      }
    }
    setExecutionResult(null)
  }, [language, question])

  // Load Monaco Editor dynamically from CDN
  useEffect(() => {
    let isMounted = true

    const initMonaco = () => {
      if (!monacoContainerRef.current || monacoEditorRef.current) return

      if (window.monaco) {
        createEditor()
        return
      }

      // Check if loader script already injected
      if (window.require && window.require.config) {
        loadMonacoCore()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js'
      script.async = true
      script.onload = () => {
        if (!isMounted) return
        loadMonacoCore()
      }
      script.onerror = () => {
        if (isMounted) setMonacoError(true)
      }
      document.body.appendChild(script)
    }

    const loadMonacoCore = () => {
      if (!window.require) {
        if (isMounted) setMonacoError(true)
        return
      }
      window.require.config({
        paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
      })
      window.require(['vs/editor/editor.main'], () => {
        if (isMounted) {
          createEditor()
        }
      })
    }

    const createEditor = () => {
      if (!monacoContainerRef.current || monacoEditorRef.current || !window.monaco) return
      try {
        const editor = window.monaco.editor.create(monacoContainerRef.current, {
          value: code,
          language: MONACO_LANGUAGES[currentLang] || 'javascript',
          theme: 'vs-dark',
          automaticLayout: true,
          fontSize: 13,
          fontFamily: 'Consolas, "Fira Code", Monaco, "Courier New", monospace',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          lineNumbers: 'on',
          roundedSelection: true,
          cursorBlinking: 'smooth',
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          tabSize: 2,
        })

        editor.onDidChangeModelContent(() => {
          const val = editor.getValue()
          setCode(val)
        })

        monacoEditorRef.current = editor
        if (isMounted) setMonacoLoaded(true)
        setTimeout(() => {
          try { editor.layout() } catch (e) { /* ignore */ }
        }, 100)

      } catch (err) {
        console.error('Monaco initialization error:', err)
        if (isMounted) setMonacoError(true)
      }
    }

    if (activeTab === 'editor') {
      initMonaco()
    }

    return () => {
      isMounted = false
    }
  }, [activeTab, currentLang])

  const handleLanguageSelect = (lang) => {
    setCurrentLang(lang)
    if (onLanguageChange) onLanguageChange(lang)
    const newCode = BOILERPLATES[lang] || BOILERPLATES.javascript
    setCode(newCode)
    setExecutionResult(null)

    if (monacoEditorRef.current && window.monaco) {
      monacoEditorRef.current.setValue(newCode)
      const model = monacoEditorRef.current.getModel()
      if (model) {
        window.monaco.editor.setModelLanguage(model, MONACO_LANGUAGES[lang] || 'javascript')
      }
    }
  }

  const handleResetCode = () => {
    const defaultCode = question?.starterCode || BOILERPLATES[currentLang] || BOILERPLATES.javascript
    setCode(defaultCode)
    setExecutionResult(null)
    if (monacoEditorRef.current) {
      monacoEditorRef.current.setValue(defaultCode)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const { selectionStart, selectionEnd, value } = textarea

    if (e.key === 'Tab') {
      e.preventDefault()
      const indent = '  '
      const newValue = value.substring(0, selectionStart) + indent + value.substring(selectionEnd)
      setCode(newValue)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + indent.length
      }, 0)
    }

    const pairs = { '{': '}', '(': ')', '[': ']', '"': '"', "'": "'", '`': '`' }
    if (pairs[e.key] && selectionStart === selectionEnd) {
      const closingChar = pairs[e.key]
      const nextChar = value[selectionStart]
      if (e.key !== '"' && e.key !== "'" && e.key !== '`' || nextChar !== e.key) {
        e.preventDefault()
        const newValue = value.substring(0, selectionStart) + e.key + closingChar + value.substring(selectionEnd)
        setCode(newValue)
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1
        }, 0)
      }
    }
  }

  const handleSelectionChange = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const pos = textarea.selectionStart
    const lines = textarea.value.substring(0, pos).split('\n')
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    })
  }

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleRunCode = async () => {
    setActiveTab('testcases')
    if (onExecuteCode) {
      const res = await onExecuteCode({
        language: currentLang,
        code,
        testCases: question?.testCases || [],
        question: question?.question || ''
      })
      if (res?.result) {
        setExecutionResult(res.result)
      }
    }
  }

  const handleSubmit = () => {
    if (onSubmitCode) {
      onSubmitCode({
        language: currentLang,
        code,
        compiledSuccessfully: executionResult ? executionResult.compiledSuccessfully : true,
        passedCount: executionResult ? executionResult.passedCount : 0,
        totalCount: question?.testCases?.length || (executionResult ? executionResult.totalCount : 0),
        testResults: executionResult?.testResults || []
      })
    }
  }

  const testCases = question?.testCases || []
  const codeLines = code.split('\n')

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] dark:bg-[#181818] rounded-2xl border border-border/80 overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[#2d2d2d] bg-[#252526] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/20 text-primary-foreground text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Monaco VS Code IDE
          </div>
          
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-[#1e1e1e] p-1 rounded-lg border border-[#3c3c3c]">
            {['javascript', 'python', 'java', 'cpp'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageSelect(lang)}
                className={`px-2.5 py-0.5 rounded text-xs font-medium transition-all ${
                  currentLang === lang
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2d2e]'
                }`}
              >
                {lang === 'javascript' ? 'JS' : lang === 'python' ? 'Python' : lang === 'java' ? 'Java' : 'C++'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="h-7 px-2 text-xs text-gray-300 hover:text-white hover:bg-[#333]"
            title="Copy Code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetCode}
            className="h-7 px-2.5 text-xs text-gray-300 hover:text-white hover:bg-[#333]"
            title="Reset code template"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRunCode}
            disabled={isExecuting || !code.trim()}
            className="h-7 px-3 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 bg-emerald-500/10 font-medium"
          >
            {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />}
            Run & Test
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !code.trim()}
            className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Submit Solution
          </Button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center border-b border-[#2d2d2d] bg-[#252526] px-4">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`py-1.5 px-3 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'editor'
              ? 'border-primary text-white font-semibold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Source Code ({currentLang.toUpperCase()})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('testcases')}
          className={`py-1.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'testcases'
              ? 'border-primary text-white font-semibold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          Test Suite & Console Output
          {executionResult && (
            <Badge
              variant={executionResult.passedCount === executionResult.totalCount ? 'default' : 'destructive'}
              className="text-[10px] px-1.5 py-0 h-4 ml-1 font-mono"
            >
              {executionResult.passedCount}/{executionResult.totalCount} Passed
            </Badge>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-[340px] overflow-hidden flex flex-col bg-[#1e1e1e] text-[#d4d4d4] relative">
        {activeTab === 'editor' ? (
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* Real Monaco Editor Container with Isolated Absolute Positioning */}
            <div className="relative flex-1 w-full h-full min-h-[300px] overflow-hidden">
              <div
                ref={monacoContainerRef}
                className={`absolute inset-0 w-full h-full ${monacoError ? 'hidden' : 'block'}`}
              />

              {/* Loading Spinner for Monaco */}
              {!monacoLoaded && !monacoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] text-gray-400 gap-2 text-xs font-mono">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading Monaco VS Code Engine...</span>
                </div>
              )}
            </div>


            {/* Fallback Custom Editor if Monaco Error / Offline */}
            {monacoError && (
              <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="flex-1 flex relative overflow-hidden">
                  <div
                    ref={lineNumbersRef}
                    className="w-12 py-3 bg-[#1e1e1e] border-r border-[#2d2d2d] text-right pr-3 text-xs font-mono text-gray-500 select-none overflow-hidden"
                  >
                    {codeLines.map((_, i) => (
                      <div
                        key={i}
                        className={cursorPos.line === i + 1 ? 'text-white font-bold bg-[#282828] -mr-3 pr-3' : ''}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleSelectionChange}
                    onClick={handleSelectionChange}
                    onScroll={handleScroll}
                    placeholder="Write your code solution here..."
                    className="flex-1 p-3 bg-transparent text-[#d4d4d4] font-mono text-sm resize-none outline-none leading-relaxed whitespace-pre font-normal tracking-wide"
                    style={{
                      tabSize: 2,
                      fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                    }}
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* Bottom Status Bar */}
            <div className="px-4 py-1 border-t border-[#2d2d2d] bg-[#007acc] text-white text-[11px] font-mono flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <span>VS Code Monaco Engine</span>
                <span>Spaces: 2</span>
                <span>UTF-8</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="uppercase font-bold">{currentLang}</span>
                <span>{code.length} chars</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-gray-200 bg-[#1e1e1e]">
            {isExecuting ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Compiling & evaluating solution against test cases...</p>
              </div>
            ) : executionResult ? (
              <div className="space-y-4">
                {/* Status Header */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  executionResult.compiledSuccessfully && executionResult.passedCount === executionResult.totalCount
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {executionResult.compiledSuccessfully && executionResult.passedCount === executionResult.totalCount ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold">
                        {executionResult.compiledSuccessfully
                          ? `Passed ${executionResult.passedCount} of ${executionResult.totalCount} Test Cases`
                          : 'Compilation Error Detected'}
                      </h4>
                      {executionResult.compilationError && (
                        <p className="text-xs mt-1 font-mono text-red-400">{executionResult.compilationError}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs text-gray-300 border-gray-600">
                    {currentLang.toUpperCase()}
                  </Badge>
                </div>

                {/* Test Cases Results */}
                <div className="space-y-3">
                  {executionResult.testResults?.map((tr, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-[#2d2d2d] bg-[#252526] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-200">Test Case #{idx + 1}</span>
                        {tr.passed ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[11px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Passed
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[11px] gap-1">
                            <XCircle className="h-3 w-3" /> Failed
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 rounded bg-[#1e1e1e] border border-[#3c3c3c]">
                          <span className="text-gray-400 block text-[10px] uppercase font-sans">Input:</span>
                          <span className="text-gray-200">{tr.input || '(None)'}</span>
                        </div>
                        <div className="p-2 rounded bg-[#1e1e1e] border border-[#3c3c3c]">
                          <span className="text-gray-400 block text-[10px] uppercase font-sans">Expected Output:</span>
                          <span className="text-gray-200">{tr.expectedOutput}</span>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-[#1e1e1e] border border-[#3c3c3c] font-mono text-xs">
                        <span className="text-gray-400 block text-[10px] uppercase font-sans">Actual Output / Console:</span>
                        <span className={tr.passed ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                          {tr.actualOutput || '(Empty)'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : testCases.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">Click <strong>Run & Test</strong> to evaluate your solution against these test cases:</p>
                {testCases.map((tc, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-[#2d2d2d] bg-[#252526] space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-gray-400 font-sans font-medium text-[11px]">
                      <span>Test Case #{idx + 1}: {tc.description || 'Sample Input'}</span>
                      {tc.isHidden && <Badge variant="outline" className="text-[10px] border-gray-600">Hidden Case</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-400 text-[10px] font-sans">Input:</span> {tc.input}</div>
                      <div><span className="text-gray-400 text-[10px] font-sans">Expected:</span> {tc.expectedOutput}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2">
                <Play className="h-8 w-8 text-gray-600" />
                <p className="text-sm">Click "Run & Test" to execute your solution against test cases.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
