import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { autoFormatMarkdown, getLevelBadgeVariant, getLevelBadgeClassName, getReadabilityScoreTypeVariant } from './tableUtils';
import { GlossaryRow } from '@/lib/types/glossary';

interface ExpandedRowDetailsProps {
  row: GlossaryRow;
  copyToClipboard: (text: string, label: string) => void;
}

export function ExpandedRowDetails({
  row,
  copyToClipboard,
}: ExpandedRowDetailsProps) {
  return (
    <Card className="m-4 p-6">
      <div className="space-y-4">
        {row.category === 'wave' ? (
          <>
            <div>
              <h3 className="font-semibold text-lg mb-2">{row.columnName}</h3>
            </div>
            {row.remediationGuidelines && (
              <div>
                <h4 className="font-medium text-sm mb-1">Remediation Guidelines</h4>
                <div className="prose prose-sm w-full max-w-none text-foreground bg-muted p-3 rounded overflow-x-auto">
                  <ReactMarkdown>
                    {row.remediationGuidelines}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {row.waveType && (
                <Badge 
                  variant="outline"
                  className="font-medium"
                  role="status"
                  aria-label={`WAVE type: ${row.waveType}`}
                >
                  {row.waveType}
                </Badge>
              )}
            </div>
            {row.helpLink && (
              <Button variant="outline" size="sm" asChild>
                <a href={row.helpLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Documentation
                </a>
              </Button>
            )}
          </>
        ) : row.category === 'readability' ? (
          <>
            <div>
              <h3 className="font-semibold text-lg mb-2">{row.readabilityMetric}</h3>
            </div>
            {row.remediationGuidelines && (
              <div>
                <h4 className="font-medium text-sm mb-1">Remediation Guidelines</h4>
                <div className="prose prose-sm w-full max-w-none text-foreground bg-muted p-3 rounded overflow-x-auto">
                  <ReactMarkdown
                    components={{
                      code({
                        inline,
                        className,
                        children,
                        ...props
                      }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        const handleCopy = () => {
                          navigator.clipboard.writeText(codeString);
                          // Use toast if available
                          if (typeof window !== 'undefined' && (window as unknown as { toast?: (options: { title: string; description: string }) => void }).toast) {
                            ((window as unknown as { toast?: (options: { title: string; description: string }) => void }).toast as (options: { title: string; description: string }) => void)({
                              title: 'Copied to clipboard',
                              description: 'Code snippet has been copied to your clipboard.',
                            });
                          }
                        };
                        if (inline) {
                          return (
                            <code className="bg-gray-200 px-1 rounded text-xs" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <div className="relative my-2">
                            <button
                              type="button"
                              className="absolute top-2 right-2 z-10 bg-gray-100 hover:bg-gray-200 text-xs px-2 py-1 rounded border border-gray-300"
                              onClick={handleCopy}
                              aria-label="Copy code"
                            >
                              <Copy className="inline h-3 w-3 mr-1" />
                              Copy
                            </button>
                            <SyntaxHighlighter
                              style={oneDark as any}
                              language={match ? match[1] : undefined}
                              PreTag="div"
                              customStyle={{ margin: 0, borderRadius: '0.375rem', fontSize: '0.85em' }}
                              {...props}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        );
                      },
                    }}
                  >
                    {autoFormatMarkdown(row.remediationGuidelines)}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {row.readabilityScoreType && (
                <Badge 
                  variant={getReadabilityScoreTypeVariant(row.readabilityScoreType)}
                  className="font-medium"
                  role="status"
                  aria-label={`Score type: ${row.readabilityScoreType}`}
                >
                  {row.readabilityScoreType}
                </Badge>
              )}
            </div>
          </>
        ) : row.category === 'pdfua' ? (
          <>
            <div>
              <h3 className="font-semibold text-lg mb-2">{row.columnName}</h3>
            </div>
            {row.pdfuaClauseDescription && (
              <div>
                <h4 className="font-medium text-sm mb-1">PDF/UA Clause Description</h4>
                <div className="prose prose-sm w-full max-w-none text-foreground bg-muted p-3 rounded overflow-x-auto">
                  <ReactMarkdown
                    components={{
                      code({
                        inline,
                        className,
                        children,
                        ...props
                      }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        const handleCopy = () => {
                          navigator.clipboard.writeText(codeString);
                          if (typeof window !== 'undefined' && (window as any).toast) {
                            ((window as any).toast)({
                              title: 'Copied to clipboard',
                              description: 'Code snippet has been copied to your clipboard.',
                            });
                          }
                        };
                        if (inline) {
                          return (
                            <code className="bg-gray-200 px-1 rounded text-xs" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <div className="relative my-2">
                            <button
                              type="button"
                              className="absolute top-2 right-2 z-10 bg-gray-100 hover:bg-gray-200 text-xs px-2 py-1 rounded border border-gray-300"
                              onClick={handleCopy}
                              aria-label="Copy code"
                            >
                              <Copy className="inline h-3 w-3 mr-1" />
                              Copy
                            </button>
                            <SyntaxHighlighter
                              style={oneDark as any}
                              language={match ? match[1] : undefined}
                              PreTag="div"
                              customStyle={{ margin: 0, borderRadius: '0.375rem', fontSize: '0.85em' }}
                              {...props}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        );
                      },
                    }}
                  >
                    {autoFormatMarkdown(row.pdfuaClauseDescription)}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            {row.pdfuaFixingSuggestions && (
              <div>
                <h4 className="font-medium text-sm mb-1">Fixing Suggestions</h4>
                <div className="prose prose-sm w-full max-w-none text-foreground bg-muted p-3 rounded overflow-x-auto">
                  <ReactMarkdown
                    components={{
                      code({
                        inline,
                        className,
                        children,
                        ...props
                      }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        const handleCopy = () => {
                          navigator.clipboard.writeText(codeString);
                          if (typeof window !== 'undefined' && (window as any).toast) {
                            ((window as any).toast)({
                              title: 'Copied to clipboard',
                              description: 'Code snippet has been copied to your clipboard.',
                            });
                          }
                        };
                        if (inline) {
                          return (
                            <code className="bg-gray-200 px-1 rounded text-xs" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <div className="relative my-2">
                            <button
                              type="button"
                              className="absolute top-2 right-2 z-10 bg-gray-100 hover:bg-gray-200 text-xs px-2 py-1 rounded border border-gray-300"
                              onClick={handleCopy}
                              aria-label="Copy code"
                            >
                              <Copy className="inline h-3 w-3 mr-1" />
                              Copy
                            </button>
                            <SyntaxHighlighter
                              style={oneDark as any}
                              language={match ? match[1] : undefined}
                              PreTag="div"
                              customStyle={{ margin: 0, borderRadius: '0.375rem', fontSize: '0.85em' }}
                              {...props}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        );
                      },
                    }}
                  >
                    {autoFormatMarkdown(row.pdfuaFixingSuggestions)}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {row.pdfuaSeverity && (
                <Badge 
                  variant={row.pdfuaSeverity === 'Error' ? 'destructive' : row.pdfuaSeverity === 'Warning' ? 'secondary' : 'outline'}
                  className="font-medium"
                  role="status"
                  aria-label={`Severity: ${row.pdfuaSeverity}`}
                >
                  {row.pdfuaSeverity}
                </Badge>
              )}
              {row.pdfuaClause && (
                <Badge 
                  variant="outline"
                  className="font-medium"
                  role="status"
                  aria-label={`Clause: ${row.pdfuaClause}`}
                >
                  {row.pdfuaClause}
                </Badge>
              )}
            </div>
          </>
        ) : (
          <>
            <div>
              <h3 className="font-semibold text-lg mb-2">{row.wcagTitle}</h3>
              <p className="text-sm leading-relaxed">{row.wcagFullCriterionText}</p>
            </div>

            {row.remediationGuidelines && (
              <div>
                <h4 className="font-medium text-sm mb-1">Remediation Guidelines</h4>
                <div className="prose prose-sm w-full max-w-none text-foreground bg-muted p-3 rounded overflow-x-auto">
                  <ReactMarkdown
                    components={{
                      code({
                        inline,
                        className,
                        children,
                        ...props
                      }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        const handleCopy = () => {
                          navigator.clipboard.writeText(codeString);
                          // Use toast if available
                          if (typeof window !== 'undefined' && (window as any).toast) {
                            ((window as any).toast)({
                              title: 'Copied to clipboard',
                              description: 'Code snippet has been copied to your clipboard.',
                            });
                          }
                        };
                        if (inline) {
                          return (
                            <code className="bg-gray-200 px-1 rounded text-xs" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <div className="relative my-2">
                            <button
                              type="button"
                              className="absolute top-2 right-2 z-10 bg-gray-100 hover:bg-gray-200 text-xs px-2 py-1 rounded border border-gray-300"
                              onClick={handleCopy}
                              aria-label="Copy code"
                            >
                              <Copy className="inline h-3 w-3 mr-1" />
                              Copy
                            </button>
                            <SyntaxHighlighter
                              style={oneDark as any}
                              language={match ? match[1] : undefined}
                              PreTag="div"
                              customStyle={{ margin: 0, borderRadius: '0.375rem', fontSize: '0.85em' }}
                              {...props}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        );
                      },
                    }}
                  >
                    {autoFormatMarkdown(row.remediationGuidelines)}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {row.wcagLevel && (
                <Badge 
                  variant={getLevelBadgeVariant(row.wcagLevel)}
                  className={`font-medium ${getLevelBadgeClassName(row.wcagLevel)}`}
                  role="status"
                  aria-label={`WCAG Level: ${row.wcagLevel}`}
                >
                  Level {row.wcagLevel}
                </Badge>
              )}
              {row.tags && row.tags.map((tag: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="font-medium"
                  role="status"
                  aria-label={`Tag: ${tag}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {row.helpLink && (
              <Button variant="outline" size="sm" asChild>
                <a href={row.helpLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Documentation
                </a>
              </Button>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(row.explanation, 'Guideline description')}
          >
            <Copy className="h-3 w-3 mr-2" />
            Copy Guideline Description
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(row.remediationGuidelines || row.pdfuaFixingSuggestions || '', 'Remediation recommendations')}
          >
            <Copy className="h-3 w-3 mr-2" />
            Copy Remediation Recommendations
          </Button>
        </div>
      </div>
    </Card>
  );
}
