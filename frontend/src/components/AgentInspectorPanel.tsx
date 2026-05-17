import { AgentBlackboard } from '../ai/agents/AgentBlackboard'

interface AgentInspectorPanelProps {
  blackboard: AgentBlackboard | null
}

export function AgentInspectorPanel({ blackboard }: AgentInspectorPanelProps) {
  if (!blackboard) {
    return (
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Milestone 4</p>
            <h2>🕵️ Agent Inspector</h2>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', padding: 10 }}>
          Submit a prompt in the AI Director to see agent activity.
        </p>
      </section>
    )
  }

  return (
    <section className="panel agent-inspector-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Milestone 4</p>
          <h2>🕵️ Agent Inspector</h2>
        </div>
        <div className="status-chip">{blackboard.logs.length} operations</div>
      </div>

      {blackboard.latestCritique && (
        <div className="critique-section">
          <h3>Critic Report (Score: {blackboard.latestCritique.overallScore}/100)</h3>
          {blackboard.latestCritique.issues.map((issue, i) => (
            <div key={i} className={`critique-issue severity-${issue.severity}`}>
              <strong>{issue.category.toUpperCase()}:</strong> {issue.description}
              <br />
              <em>Fix: {issue.suggestion}</em>
            </div>
          ))}
          {blackboard.latestCritique.praise.map((p, i) => (
            <div key={i} className="critique-praise">✓ {p}</div>
          ))}
        </div>
      )}

      <div className="agent-logs">
        <h3>Iteration Logs (Pass {blackboard.currentPass}/{blackboard.maxPasses})</h3>
        {blackboard.logs.map((log, i) => (
          <div key={i} className="agent-log-entry">
            <span className={`agent-badge agent-${log.agent}`}>{log.agent}</span>
            <span className={`action-badge action-${log.action.toLowerCase()}`}>{log.action}</span>
            <span className="log-details">{log.details}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
