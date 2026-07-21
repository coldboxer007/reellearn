import { addDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import type { PlanNodeStatus, StudyPlan } from '../../types';
import './PlanScreen.css';

const STATUS_LABEL: Record<PlanNodeStatus, string> = {
  pending: 'Pending',
  generating: 'Generating',
  ready: 'Ready',
  done: 'Done',
  mastered: 'Mastered',
  skipped: 'Known',
  stretch: 'Stretch',
};

interface Props {
  plan: StudyPlan;
}

export function PlanScreen({ plan }: Props) {
  const units = [...new Set(plan.nodes.map((n) => n.unit))];
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const done = plan.nodes.filter((n) => n.status === 'done' || n.status === 'mastered').length;
  const progress = Math.round((done / plan.nodes.length) * 100);

  return (
    <div className="tab-screen plan-screen">
      <header className="plan-header">
        <p className="plan-eyebrow">Study plan</p>
        <h1 className="plan-title">{plan.course_title}</h1>
        <p className="plan-meta">
          Exam {format(parseISO(plan.exam_date), 'MMM d')} · {plan.hours_per_week}h / week · {progress}% complete
        </p>
      </header>

      <div className="plan-week">
        {days.map((day) => {
          const hasNode = plan.nodes.some((n) => isSameDay(parseISO(n.scheduled_date), day));
          const isToday = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className={`plan-day ${isToday ? 'today' : ''} ${hasNode ? 'has' : ''}`}>
              <span className="plan-day-name">{format(day, 'EEEEE')}</span>
              <span className="plan-day-num">{format(day, 'd')}</span>
              {hasNode && <span className="plan-day-dot" />}
            </div>
          );
        })}
      </div>

      <div className="plan-legend">
        {(['done', 'ready', 'generating', 'pending', 'stretch'] as PlanNodeStatus[]).map((s) => (
          <span key={s} className={`legend-pill status-${s}`}>
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {units.map((unit) => (
        <section key={unit} className="plan-unit">
          <h2 className="plan-unit-title">{unit}</h2>
          <ol className="plan-nodes">
            {plan.nodes
              .filter((n) => n.unit === unit)
              .map((node, i, arr) => (
                <li key={node.id} className={`plan-node status-${node.status}`}>
                  <div className="node-rail">
                    <span className="node-dot" />
                    {i < arr.length - 1 && <span className="node-line" />}
                  </div>
                  <div className="node-body">
                    <div className="node-top">
                      <h3>{node.title}</h3>
                      <span className={`weight weight-${node.exam_weight}`}>{node.exam_weight}</span>
                    </div>
                    <p className="node-date">
                      {format(parseISO(node.scheduled_date), 'EEE, MMM d')}
                      {node.review_date && ` · review ${format(parseISO(node.review_date), 'MMM d')}`}
                    </p>
                    <p className="node-mins">
                      {node.estimated_study_minutes} min · {STATUS_LABEL[node.status]}
                    </p>
                  </div>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
