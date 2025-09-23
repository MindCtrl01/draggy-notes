import React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/styles/utils';
import { NoteTask } from '@/domains/noteTask';
import { getTaskProgress } from '@/helpers/task-manager';
import { TASK_MODE, TEXT } from '@/constants/ui-constants';

interface NoteTaskModeProps {
  tasks: NoteTask[];
  newTaskText: string;
  editingTaskId: number | null;
  taskTextareaRef: React.RefObject<HTMLTextAreaElement>;
  taskColors: {
    taskBgColor: string;
    taskBgHoverColor: string;
    taskBorderColor: string;
    addTaskBgColor: string;
    addTaskBgHoverColor: string;
    addTaskBorderColor: string;
    addTaskBorderHoverColor: string;
    progressBarBgColor: string;
    progressBarFillColor: string;
  };
  onNewTaskTextChange: (value: string) => void;
  onAddTask: () => void;
  onTaskKeyDown: (e: React.KeyboardEvent) => void;
  onToggleTask: (taskId: number) => void;
  onEditTask: (taskId: number, newText: string) => void;
  onDeleteTask: (taskId: number) => void;
  onStartEditingTask: (taskId: number) => void;
  onTaskEditKeyDown: (e: React.KeyboardEvent, taskId: number) => void;
  isDetail?: boolean;
  className?: string;
}

export const NoteTaskMode: React.FC<NoteTaskModeProps> = ({
  tasks,
  newTaskText,
  editingTaskId,
  taskTextareaRef,
  taskColors,
  onNewTaskTextChange,
  onAddTask,
  onTaskKeyDown,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onStartEditingTask,
  onTaskEditKeyDown,
  isDetail = false,
  className = '',
}) => {
  const progress = getTaskProgress(tasks);

  return (
    <div 
      className={`note-task-mode ${className}`}
      style={{
        '--task-bg-color': taskColors.taskBgColor,
        '--task-bg-hover-color': taskColors.taskBgHoverColor,
        '--task-border-color': taskColors.taskBorderColor,
        '--add-task-bg-color': taskColors.addTaskBgColor,
        '--add-task-bg-hover-color': taskColors.addTaskBgHoverColor,
        '--add-task-border-color': taskColors.addTaskBorderColor,
        '--add-task-border-hover-color': taskColors.addTaskBorderHoverColor,
        '--progress-bar-bg-color': taskColors.progressBarBgColor,
        '--progress-bar-fill-color': taskColors.progressBarFillColor,
      } as React.CSSProperties}
    >
      {tasks && tasks.length > 0 && (
        <>
          <div className="task-header-text">
            <span className={isDetail ? 'text-lg font-medium' : 'text-sm font-medium'}>
              {isDetail ? 'Tasks' : 'Progress'}
            </span>
          </div>
          <div className={`task-progress-container ${isDetail ? 'mb-6' : ''}`}>
            <div className="task-progress-bar">
              <div 
                className="task-progress-fill"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </>
      )}
      
      <div 
        className="task-list"
        onClick={(e) => {
          // Only focus on textarea if clicking on empty space (not on task items)
          const target = e.target as HTMLElement;
          if (target === e.currentTarget || target.classList.contains('task-list')) {
            e.stopPropagation();
            if (taskTextareaRef.current) {
              taskTextareaRef.current.focus();
            }
          }
        }}
      >
        {tasks?.map((task) => (
          <div key={task.id} className="task-item-container">
            <button
              className={cn('task-checkbox', task.completed && 'checked')}
              onClick={(e) => {
                e.stopPropagation();
                onToggleTask(task.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            />
            
            <div 
              className="task-item"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className={cn('task-text', task.completed && 'completed')}>
                {editingTaskId === task.id ? (
                  <textarea
                    defaultValue={task.text}
                    onBlur={(e) => onEditTask(task.id, e.target.value)}
                    onKeyDown={(e) => onTaskEditKeyDown(e, task.id)}
                    onMouseDown={(e) => e.stopPropagation()}
                    autoFocus
                    rows={1}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, TASK_MODE.INPUT_LINE_HEIGHT_PX * TASK_MODE.INPUT_MAX_HEIGHT_MULTIPLIER * TASK_MODE.INPUT_MIN_HEIGHT) + 'px';
                    }}
                  />
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartEditingTask(task.id);
                    }}
                    title={task.text.length > TEXT.MAX_TASK_TEXT_LENGTH ? task.text : undefined}
                  >
                    {task.text}
                  </div>
                )}
              </div>
            </div>
            
            <button
              className="task-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <X size={TASK_MODE.TOGGLE_FONT_SIZE} />
            </button>
          </div>
        ))}
        
        {/* Add new task */}
        <div 
          className="add-task-button"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <textarea
            ref={taskTextareaRef}
            placeholder="Add new task..."
            value={newTaskText}
            onChange={(e) => {
              onNewTaskTextChange(e.target.value);
            }}
            onKeyDown={onTaskKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full bg-transparent border-none outline-none resize-none"
            rows={1}
            style={{ minHeight: `${TASK_MODE.INPUT_MIN_HEIGHT}em`, maxHeight: `calc(${TASK_MODE.INPUT_MIN_HEIGHT}em * ${TASK_MODE.INPUT_MAX_HEIGHT_MULTIPLIER})` }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, TASK_MODE.INPUT_LINE_HEIGHT_PX * TASK_MODE.INPUT_MAX_HEIGHT_MULTIPLIER * TASK_MODE.INPUT_MIN_HEIGHT) + 'px';
            }}
          />
          {newTaskText && (
            <button
              onClick={onAddTask}
              onMouseDown={(e) => e.stopPropagation()}
              className="ml-2 p-1 hover:bg-black/10 rounded flex-shrink-0"
            >
              <Plus size={TASK_MODE.TOGGLE_FONT_SIZE} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
