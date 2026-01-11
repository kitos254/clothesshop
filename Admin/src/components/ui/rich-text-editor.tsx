import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Underline } from '@tiptap/extension-underline';
import { Bold, Italic, List, Underline as UnderlineIcon, Table as TableIcon, Plus, Minus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
}

// Helper to decode HTML entities
const decodeHtmlEntities = (str: string): string => {
  if (!str) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  label,
  id,
  className
}) => {
  const [isInTable, setIsInTable] = useState(false);

  // Decode value on initial load
  const decodedInitialValue = decodeHtmlEntities(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-inside',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'mb-1',
          },
        },
      }),
      Underline,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full border border-border dark:border-gray-600',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border dark:border-gray-600 bg-muted dark:bg-gray-800 font-semibold p-2',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border dark:border-gray-600 p-2 min-w-[100px]',
        },
      }),
    ],
    content: decodedInitialValue,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      // Update table state
      setIsInTable(editor.isActive('table'));
    },
    onSelectionUpdate: ({ editor }) => {
      // Update table state on selection change
      setIsInTable(editor.isActive('table'));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      setIsInTable(editor.isActive('table'));
      
      // Add keyboard shortcuts for table operations
      const handleKeyDown = (event: KeyboardEvent) => {
        if (!isInTable) return;
        
        // Tab to move to next cell
        if (event.key === 'Tab' && !event.shiftKey) {
          event.preventDefault();
          editor.chain().focus().goToNextCell().run();
        }
        
        // Shift+Tab to move to previous cell
        if (event.key === 'Tab' && event.shiftKey) {
          event.preventDefault();
          editor.chain().focus().goToPreviousCell().run();
        }
        
        // Enter to add new row
        if (event.key === 'Enter' && event.ctrlKey) {
          event.preventDefault();
          editor.chain().focus().addRowAfter().run();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [editor, isInTable]);

  // Update editor content when value prop changes (e.g., when product data loads)
  useEffect(() => {
    if (editor && value !== undefined && value !== null) {
      const currentContent = editor.getHTML();
      // Decode HTML entities in case the content was escaped
      const decodedValue = decodeHtmlEntities(value);
      // Only update if the content is actually different to avoid cursor jumping
      if (currentContent !== decodedValue && decodedValue !== '' && currentContent !== value) {
        editor.commands.setContent(decodedValue, { emitUpdate: false });
      }
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id}>{label}</Label>
      )}
      
      <div className="border border-input rounded-md bg-background dark:bg-gray-900">
        {/* Toolbar */}
        <div className="border-b border-input p-2 flex gap-1 bg-muted/50 dark:bg-gray-800/50">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="h-8 w-8 p-0"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="h-8 w-8 p-0"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className="h-8 w-8 p-0"
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button
            type="button"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Table Controls */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant={isInTable ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2"
                title="Table Options"
              >
                <TableIcon className="h-4 w-4 mr-1" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                disabled={isInTable}
              >
                <Plus className="h-4 w-4 mr-2" />
                Insert Table (3x3)
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run()}
                disabled={isInTable}
              >
                <Plus className="h-4 w-4 mr-2" />
                Insert Simple Table (2x2)
              </DropdownMenuItem>
              
              {isInTable && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row Above
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row Below <span className="ml-auto text-xs text-muted-foreground">Ctrl+Enter</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column Left
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column Right
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                  >
                    <TableIcon className="h-4 w-4 mr-2" />
                    Toggle Header Row
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
                  >
                    <TableIcon className="h-4 w-4 mr-2" />
                    Toggle Header Column
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().deleteRow().run()}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Delete Current Row
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Delete Current Column
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="text-destructive"
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Delete Entire Table
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    <div>Tab: Next cell</div>
                    <div>Shift+Tab: Previous cell</div>
                    <div>Ctrl+Enter: Add row</div>
                  </div>
                </>
              )}
              
              {!isInTable && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    Click inside a table for more options
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Editor Content */}
        <div className="min-h-[100px] relative bg-background dark:bg-gray-900">
          <EditorContent 
            editor={editor}
            className={cn(
              "prose prose-sm max-w-none dark:prose-invert",
              "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px] [&_.ProseMirror]:p-3",
              "[&_.ProseMirror]:bg-transparent [&_.ProseMirror]:text-foreground",
              // Table styles - responsive to theme
              "[&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:table-auto [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border [&_.ProseMirror_table]:border-border [&_.ProseMirror_table]:my-4",
              "[&_.ProseMirror_table]:dark:border-gray-600",
              "[&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border [&_.ProseMirror_td]:p-2 [&_.ProseMirror_td]:min-w-[100px] [&_.ProseMirror_td]:relative",
              "[&_.ProseMirror_td]:dark:border-gray-600 [&_.ProseMirror_td]:dark:text-gray-200",
              "[&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:bg-muted [&_.ProseMirror_th]:font-semibold [&_.ProseMirror_th]:relative",
              "[&_.ProseMirror_th]:dark:border-gray-600 [&_.ProseMirror_th]:dark:bg-gray-800 [&_.ProseMirror_th]:dark:text-gray-100",
              "[&_.ProseMirror_.selectedCell]:bg-blue-100 [&_.ProseMirror_.selectedCell]:relative",
              "[&_.ProseMirror_.selectedCell]:dark:bg-blue-900 [&_.ProseMirror_.selectedCell]:dark:text-gray-100",
              "[&_.ProseMirror_.column-resize-handle]:absolute [&_.ProseMirror_.column-resize-handle]:right-[-2px] [&_.ProseMirror_.column-resize-handle]:top-0 [&_.ProseMirror_.column-resize-handle]:bottom-0 [&_.ProseMirror_.column-resize-handle]:w-1 [&_.ProseMirror_.column-resize-handle]:bg-blue-500 [&_.ProseMirror_.column-resize-handle]:cursor-col-resize",
              "[&_.ProseMirror_.column-resize-handle]:dark:bg-blue-400",
              // Underline styles
              "[&_.ProseMirror_u]:underline",
              // List styles for dark theme
              "[&_.ProseMirror_ul]:dark:text-gray-200 [&_.ProseMirror_li]:dark:text-gray-200",
              // Focus styles - theme aware
              "[&_.ProseMirror:focus-within_table]:ring-2 [&_.ProseMirror:focus-within_table]:ring-blue-200 [&_.ProseMirror:focus-within_table]:ring-offset-1",
              "[&_.ProseMirror:focus-within_table]:dark:ring-blue-800 [&_.ProseMirror:focus-within_table]:dark:ring-offset-gray-900"
            )}
          />
          
          {/* Table status indicator */}
          {isInTable && (
            <div className="absolute bottom-2 right-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded border border-blue-200 dark:border-blue-700">
              In Table - Use dropdown for editing options
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
export { RichTextEditor };
