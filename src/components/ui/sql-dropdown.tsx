import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";

interface SQLDropdownProps {
  sql: string | null | undefined;
}

function formatSQL(sql: string | null | undefined): string {
  // Handle null/empty SQL (GraphQL queries don't have SQL)
  if (!sql) return '';

  // Basic SQL formatting with proper indentation
  return sql
    // Add newlines before major keywords
    .replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|LIMIT|OFFSET)\b/gi, '\n$1')
    // Add newlines after commas in SELECT
    .replace(/,(?=\s*[a-zA-Z_])/g, ',\n  ')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function highlightSQL(sql: string | null | undefined): React.ReactNode {
  // Handle null/empty SQL
  if (!sql) return null;
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN',
    'LIKE', 'IS', 'NULL', 'AS', 'ON', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL',
    'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'CASE', 'WHEN', 'THEN',
    'ELSE', 'END', 'ASC', 'DESC', 'WITH', 'INSERT', 'UPDATE', 'DELETE', 'INTO',
    'VALUES', 'SET', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW'
  ];

  const functions = [
    'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'ROUND', 'CEILING', 'FLOOR', 'ABS',
    'COALESCE', 'NULLIF', 'CAST', 'CONVERT', 'CONCAT', 'SUBSTRING', 'TRIM',
    'UPPER', 'LOWER', 'LENGTH', 'REPLACE', 'NOW', 'DATE', 'YEAR', 'MONTH', 'DAY'
  ];

  // Format the SQL first
  const formattedSQL = formatSQL(sql);

  // Split by lines to preserve formatting
  const lines = formattedSQL.split('\n');

  return lines.map((line, lineIndex) => {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Collect all matches with their positions
    const matches: Array<{ start: number; end: number; type: string; value: string }> = [];

    // Comments
    let match: RegExpExecArray | null;
    const commentRe = /--[^\n]*/g;
    commentRe.lastIndex = 0;
    while ((match = commentRe.exec(line)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length, type: 'comment', value: match[0] });
    }

    // Strings - match complete quoted strings
    const stringRe = /'[^']*'/g;
    stringRe.lastIndex = 0;
    while ((match = stringRe.exec(line)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length, type: 'string', value: match[0] });
    }

    // Helper function to check if a match overlaps with existing matches
    const isOverlapping = (start: number, end: number) => {
      return matches.some(m =>
        (start >= m.start && start < m.end) ||
        (end > m.start && end <= m.end) ||
        (start <= m.start && end >= m.end)
      );
    };

    // Numbers - skip if inside strings/comments
    const numberRe = /\b\d+\.?\d*\b/g;
    numberRe.lastIndex = 0;
    while ((match = numberRe.exec(line)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      if (!isOverlapping(matchStart, matchEnd)) {
        matches.push({ start: matchStart, end: matchEnd, type: 'number', value: match[0] });
      }
    }

    // Functions - skip if inside strings/comments
    const functionRe = new RegExp(`\\b(?:${functions.join('|')})(?=\\s*\\()`, 'gi');
    functionRe.lastIndex = 0;
    while ((match = functionRe.exec(line)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      if (!isOverlapping(matchStart, matchEnd)) {
        matches.push({ start: matchStart, end: matchEnd, type: 'function', value: match[0] });
      }
    }

    // Keywords - skip if inside strings/comments
    const keywordRe = new RegExp(`\\b(?:${keywords.join('|')})\\b`, 'gi');
    keywordRe.lastIndex = 0;
    while ((match = keywordRe.exec(line)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      if (!isOverlapping(matchStart, matchEnd)) {
        matches.push({ start: matchStart, end: matchEnd, type: 'keyword', value: match[0] });
      }
    }
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // Build the highlighted line
    matches.forEach((match, index) => {
      // Add text before this match
      if (match.start > lastIndex) {
        elements.push(line.substring(lastIndex, match.start));
      }
      
      // Add the highlighted match
      const key = `${lineIndex}-${index}`;
      switch (match.type) {
        case 'keyword':
          elements.push(<span key={key} className="text-blue-600 font-semibold">{match.value}</span>);
          break;
        case 'function':
          elements.push(<span key={key}>{match.value}</span>);
          break;
        case 'string':
          elements.push(<span key={key} className="text-green-600">{match.value}</span>);
          break;
        case 'number':
          elements.push(<span key={key} className="text-green-600">{match.value}</span>);
          break;
        case 'comment':
          elements.push(<span key={key} className="text-gray-500 italic">{match.value}</span>);
          break;
      }
      
      lastIndex = match.end;
    });
    
    // Add any remaining text
    if (lastIndex < line.length) {
      elements.push(line.substring(lastIndex));
    }
    
    // If no matches, just use the plain line
    if (elements.length === 0) {
      elements.push(line);
    }
    
    return (
      <div key={lineIndex} className="font-mono">
        {elements}
      </div>
    );
  });
}

export function SQLDropdown({ sql }: SQLDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Code className="h-4 w-4 mr-2" />
          View Data Query
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-[90vw] max-h-[400px] overflow-auto p-4">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <pre className="text-sm leading-relaxed whitespace-pre">
            <code>{highlightSQL(sql)}</code>
          </pre>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}