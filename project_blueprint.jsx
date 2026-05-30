import { useState } from "react";

const PHASES = [
  {
    id: 1, label: "Foundation", days: "1–4", color: "teal",
    tasks: [
      "Go module skeleton: cmd/, internal/, pkg/",
      "SQLite schema: runs, metrics, experiments tables",
      "llama.cpp subprocess wrapper (os/exec, streaming stdout)",
      "Basic CLI: run, list, show commands",
    ],
    paper: "Reproducible experiment baseline — every run tracked from day 1",
    output: "Binary that runs llama.cpp and stores latency results"
  },
  {
    id: 2, label: "Telemetry", days: "5–8", color: "blue",
    tasks: [
      "/proc/[pid]/stat reader (CPU, RSS, context switches)",
      "perf stat subprocess wrapper → parse LLC misses, IPC",
      "pidstat integration for thread-level CPU breakdown",
      "Telemetry struct → correlated time-series in SQLite",
    ],
    paper: "Hardware counters that prove the contention hypothesis — LLC miss vs p99 correlation",
    output: "Telemetry collector that runs alongside inference and stores correlated metrics"
  },
  {
    id: 3, label: "Benchmark Harness", days: "9–12", color: "purple",
    tasks: [
      "Experiment DSL (YAML/JSON): threads, batch, memory_pressure params",
      "Controlled variable runner: vary one param, hold others fixed",
      "p50/p95/p99 latency computation from token stream timestamps",
      "Experiment comparison: baseline vs variant delta tables",
    ],
    paper: "Publishable evaluation methodology — structured experiment matrix, not ad-hoc runs",
    output: "Run `experiment.yaml` → automatic multi-variant benchmark with results stored"
  },
  {
    id: 4, label: "Contention Injection", days: "13–16", color: "coral",
    tasks: [
      "Memory bandwidth saturator (C++): stress-ng wrapper or custom allocator loop",
      "Noisy neighbor simulator: co-located CPU-heavy process launcher",
      "NUMA contention: pin processes to remote NUMA nodes",
      "Contention level knobs: low/medium/high presets",
    ],
    paper: "Controlled contention generation = reproducible instability for hypothesis testing",
    output: "Inject contention → observe latency variance spike → telemetry shows LLC degradation"
  },
  {
    id: 5, label: "Agent Layer", days: "17–20", color: "amber",
    tasks: [
      "Claude API integration: telemetry JSON → natural language analysis",
      "Anomaly detector: flag p99 spikes correlated with LLC miss bursts",
      "Experiment recommendation: suggest next parameter to vary",
      "Markdown report generator: methods + results section scaffold",
    ],
    paper: "Automated paper results section — graphs + narrative from structured metrics",
    output: "Agent reads benchmark run → outputs: root cause, recommendation, report draft"
  },
  {
    id: 6, label: "HTMX Dashboard + Polish", days: "21–24", color: "gray",
    tasks: [
      "HTMX server (Go net/http): experiment list, run detail, comparison view",
      "Terminal tables for TUI fallback (lipgloss or tablewriter)",
      "Export: CSV + Markdown report from any experiment set",
      "Integration demo: full flow from cold start to report",
    ],
    paper: "Presentation-ready demo for supervisors / reviewers",
    output: "Working demo: run benchmark → view telemetry → read agent report"
  }
];

const ARCH_NODES = [
  { id: "cli", label: "CLI / HTMX UI", sub: "commands + dashboard", col: 2, row: 0, color: "gray" },
  { id: "em", label: "Experiment Manager", sub: "orchestrates runs", col: 2, row: 1, color: "teal" },
  { id: "wr", label: "Workload Runner", sub: "llama.cpp / Ollama", col: 1, row: 2, color: "blue" },
  { id: "tc", label: "Telemetry Collector", sub: "perf, /proc, pidstat", col: 2, row: 2, color: "blue" },
  { id: "si", label: "Stress Injector", sub: "noisy neighbor, NUMA", col: 3, row: 2, color: "coral" },
  { id: "ms", label: "Metrics Store", sub: "SQLite", col: 2, row: 3, color: "purple" },
  { id: "ae", label: "Analysis Engine", sub: "correlation, anomaly", col: 2, row: 4, color: "amber" },
  { id: "ag", label: "Agent Layer", sub: "Claude API", col: 1, row: 5, color: "amber" },
  { id: "rg", label: "Report Generator", sub: "markdown + CSV", col: 3, row: 5, color: "gray" },
  { id: "rpl", label: "Research Policy Layer", sub: "SEPARATE — paper core", col: 4, row: 3, color: "teal", separate: true },
];

const PAPER_MAP = [
  { component: "Telemetry Collector", contribution: "LLC miss ↔ p99 latency correlation", section: "Results / Evidence" },
  { component: "Benchmark Harness", contribution: "Controlled experiment matrix", section: "Methodology" },
  { component: "Contention Injector", contribution: "Reproducible instability baseline", section: "Experimental Setup" },
  { component: "Metrics Store", contribution: "Structured time-series for analysis", section: "Data Collection" },
  { component: "Analysis Engine", contribution: "Statistical variance + anomaly detection", section: "Analysis" },
  { component: "Agent Layer", contribution: "Automated report + root cause narrative", section: "Discussion / Results" },
  { component: "Runtime Adapters", contribution: "Generalizability across runtimes", section: "Evaluation" },
  { component: "Research Policy Layer", contribution: "Novel adaptive scheduling logic", section: "Core Contribution" },
];

const colorMap = {
  teal: { bg: "#E1F5EE", border: "#0F6E56", text: "#085041", badge: "#9FE1CB" },
  blue: { bg: "#E6F1FB", border: "#185FA5", text: "#0C447C", badge: "#B5D4F4" },
  purple: { bg: "#EEEDFE", border: "#534AB7", text: "#3C3489", badge: "#CECBF6" },
  coral: { bg: "#FAECE7", border: "#993C1D", text: "#712B13", badge: "#F5C4B3" },
  amber: { bg: "#FAEEDA", border: "#854F0B", text: "#633806", badge: "#FAC775" },
  gray: { bg: "#F1EFE8", border: "#5F5E5A", text: "#444441", badge: "#D3D1C7" },
};

function PhaseCard({ phase, active, onClick }) {
  const c = colorMap[phase.color];
  return (
    <div
      onClick={onClick}
      style={{
        border: active ? `1.5px solid ${c.border}` : "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "12px 14px",
        cursor: "pointer",
        background: active ? c.bg : "var(--color-background-primary)",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: active ? c.text : "var(--color-text-primary)" }}>
          Phase {phase.id} · {phase.label}
        </span>
        <span style={{
          fontSize: 11, padding: "2px 8px", borderRadius: 20,
          background: c.badge, color: c.text, fontWeight: 500
        }}>Days {phase.days}</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
        {phase.output}
      </p>
    </div>
  );
}

function PhaseDetail({ phase }) {
  const c = colorMap[phase.color];
  return (
    <div style={{
      border: `0.5px solid var(--color-border-tertiary)`,
      borderRadius: "var(--border-radius-lg)",
      background: "var(--color-background-primary)",
      padding: "20px 24px",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <span style={{
          fontSize: 12, padding: "3px 10px", borderRadius: 20,
          background: c.bg, color: c.text, border: `0.5px solid ${c.border}`, fontWeight: 500
        }}>Days {phase.days}</span>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Phase {phase.id}: {phase.label}</h3>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 8px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tasks</p>
        {phase.tasks.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
            <span style={{ width: 18, height: 18, borderRadius: 4, background: c.bg, border: `0.5px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 500, color: c.text, marginTop: 1 }}>{i+1}</span>
            <span style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{
        padding: "12px 14px",
        background: c.bg,
        borderRadius: "var(--border-radius-md)",
        borderLeft: `3px solid ${c.border}`,
      }}>
        <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 500, color: c.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>Paper alignment</p>
        <p style={{ margin: 0, fontSize: 13, color: c.text }}>{phase.paper}</p>
      </div>
    </div>
  );
}

export default function Blueprint() {
  const [activePhase, setActivePhase] = useState(0);
  const [tab, setTab] = useState("plan");

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 700, padding: "1.5rem 0" }}>
      <h2 style={{ sr: "only", position: "absolute", opacity: 0 }}>Project blueprint for LLM runtime experimentation harness</h2>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
          24-day build · Go + C++ · HTMX / TUI
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, lineHeight: 1.3 }}>
          LLM Runtime Experimentation Harness
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>
          Kernel-telemetry-guided adaptation for memory-bound CPU inference
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "0.5px solid var(--color-border-tertiary)", paddingBottom: 0 }}>
        {["plan", "architecture", "paper"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 14px", fontSize: 13, fontWeight: tab === t ? 500 : 400,
              color: tab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              borderBottom: tab === t ? "2px solid var(--color-text-primary)" : "2px solid transparent",
              marginBottom: -1, transition: "all 0.1s"
            }}
          >
            {t === "plan" ? "24-Day Plan" : t === "architecture" ? "Architecture" : "Paper Alignment"}
          </button>
        ))}
      </div>

      {tab === "plan" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {PHASES.map((p, i) => (
              <PhaseCard key={p.id} phase={p} active={activePhase === i} onClick={() => setActivePhase(i)} />
            ))}
          </div>
          <PhaseDetail phase={PHASES[activePhase]} />
        </div>
      )}

      {tab === "architecture" && (
        <div>
          <svg width="100%" viewBox="0 0 680 480" role="img">
            <title>System architecture diagram</title>
            <desc>Layered architecture: CLI at top, experiment manager, parallel runners/telemetry/stress injector, metrics store, analysis engine, agent + report generator. Research policy layer is separate on the right.</desc>
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </marker>
            </defs>

            {/* CLI */}
            <g class="c-gray">
              <rect x="220" y="20" width="200" height="44" rx="8" stroke-width="0.5"/>
              <text class="th" x="320" y="38" text-anchor="middle" dominant-baseline="central">CLI / HTMX UI</text>
              <text class="ts" x="320" y="54" text-anchor="middle" dominant-baseline="central">commands + dashboard</text>
            </g>

            {/* Arrow CLI → EM */}
            <line x1="320" y1="64" x2="320" y2="98" stroke="var(--color-border-secondary)" stroke-width="1" marker-end="url(#arr)" fill="none"/>

            {/* Experiment Manager */}
            <g class="c-teal">
              <rect x="200" y="100" width="240" height="44" rx="8" stroke-width="0.5"/>
              <text class="th" x="320" y="118" text-anchor="middle" dominant-baseline="central">Experiment Manager</text>
              <text class="ts" x="320" y="134" text-anchor="middle" dominant-baseline="central">orchestrates runs</text>
            </g>

            {/* Arrows EM → runners */}
            <line x1="240" y1="144" x2="140" y2="178" stroke="var(--color-border-secondary)" stroke-width="1" marker-end="url(#arr)" fill="none"/>
            <line x1="320" y1="144" x2="320" y2="178" stroke="var(--color-border-secondary)" stroke-width="1" marker-end="url(#arr)" fill="none"/>
            <line x1="400" y1="144" x2="500" y2="178" stroke="var(--color-border-secondary)" stroke-width="1" marker-end="url(#arr)" fill="none"/>

            {/* Workload Runner */}
            <g class="c-blue">
              <rect x="50" y="180" width="170" height="44" rx="8" stroke-width="0.5"/>
              <text class="th" x="135" y="198" text-anchor="middle" dominant-baseline="central">Workload Runner</text>
              <text class="ts" x="135" y="214" text-anchor="middle" dominant-baseline="central">llama.cpp / Ollama</text>
            </g>

            {/* Telemetry Collector */}
            <g class="c-blue">
              <rect x="235" y="180" width="170" height="44" rx="8" stroke-width="0.5"/>
              <text class="th" x="320" y="198" text-anchor="middle" dominant-baseline="central">Telemetry Collector</text>
              <text class="ts" x="320" y="214" text-anchor="middle" dominant-baseline="central">perf · /proc · pidstat</text>
            </g>

            {/* Stress Injector */}
            <g class="c-coral">
              <rect x="420" y="180" width="170" height="44" rx="8" stroke-width="0.5"/>
              <text class="th" x="505" y="198" text-anchor="middle" dominant-baseline="central">Stress Injector</text>
              <text class="ts" x="505" y="214" text-anchor="middle" dominant-baseline="central">noisy neighbor · NUMA</text>
            </g>

            {/* Arrows → Metrics Store */}
            <line x1="135" y1="224" x2="270" y2="278" stroke="var(--color-border-secondary)" stroke-width="1" marker-end="url(#arr)" fill="none"/>
            <line x1="320" y1="224" x2="320" y2="278" stroke="var(--color-border-secondary)" stroke-width="1" marker-end="url(#arr)" fill="none"/>
            <line x1="505" y1="224" x2="380" y2="278" stroke="var(--color-border-secondary)" stroke-width="1" marker-end="url(#arr)" fill="none"/>

            {/* Metrics Store */}
            <g class="c-purple">
              <rect x="220" y="280" width="200" height="44" rx="8" stroke-width="0.5"/>
              <text class="th" x="320" y="298" text-anchor="middle" dominant-baseline="central">Metrics Store</text>
              <text class="ts" x="320" y="314" text-anchor="middle" dominant-baseline="central">SQLite · correlated series</text>
            </g>

            {/* Arrow → Analysis */}
            <line x1="320" y1="324" x2="320" y2="358" stroke="var(--color-border-secondary)" stroke-width="1" marker-end="url(#arr)" fill="none"/>

            {/* Analysis Engine */}
            <g class="c-amber">
              <rect x="210" y="360" width="220" height="44" rx="8" stroke-width="0.5"/>
              <text class="th" x="320" y="378" text-anchor="middle" dominant-baseline="central">Analysis Engine</text>
              <text class="ts" x="320" y="394" text-anchor="middle" dominant-baseline="central">variance · anomaly · correlation</text>
            </g>

            {/* Arrows → Agent + Report */}
            <line x1="260" y1="404" x2="160" y2="438" stroke="var(--color-border-secondary)" stroke-width="1" marker-end="url(#arr)" fill="none"/>
            <line x1="380" y1="404" x2="480" y2="438" stroke="var(--color-border-secondary)" stroke-width="1" marker-end="url(#arr)" fill="none"/>

            {/* Agent Layer */}
            <g class="c-amber">
              <rect x="60" y="440" width="180" height="44" rx="8" stroke-width="0.5"/>
              <text class="th" x="150" y="458" text-anchor="middle" dominant-baseline="central">Agent Layer</text>
              <text class="ts" x="150" y="474" text-anchor="middle" dominant-baseline="central">Claude API · analysis</text>
            </g>

            {/* Report Generator */}
            <g class="c-gray">
              <rect x="400" y="440" width="180" height="44" rx="8" stroke-width="0.5"/>
              <text class="th" x="490" y="458" text-anchor="middle" dominant-baseline="central">Report Generator</text>
              <text class="ts" x="490" y="474" text-anchor="middle" dominant-baseline="central">markdown · CSV export</text>
            </g>

            {/* Research Policy Layer — SEPARATE */}
            <rect x="600" y="250" width="2" height="180" stroke-dasharray="4 3" stroke="var(--color-border-secondary)" stroke-width="1" fill="none"/>
          </svg>

          {/* Research policy layer note - separate box below */}
          <div style={{
            border: "1.5px dashed var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)",
            padding: "12px 16px",
            marginTop: 8,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}>
            <div style={{
              padding: "3px 10px", fontSize: 11, background: colorMap.teal.bg,
              color: colorMap.teal.text, border: `0.5px solid ${colorMap.teal.border}`,
              borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap"
            }}>SEPARATE MODULE</div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500 }}>Research Policy Layer</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
                Adaptive scheduling logic — the actual paper contribution. Lives in <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>research_policy_layer/</code>, not coupled to the harness.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "paper" && (
        <div>
          <div style={{
            padding: "12px 16px",
            background: colorMap.teal.bg,
            borderRadius: "var(--border-radius-md)",
            borderLeft: `3px solid ${colorMap.teal.border}`,
            marginBottom: 16
          }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 500, color: colorMap.teal.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>Core thesis</p>
            <p style={{ margin: 0, fontSize: 13, color: colorMap.teal.text }}>
              Memory contention causes unstable latency in CPU LLM inference. The harness proves this by collecting correlated kernel telemetry under controlled contention — then the policy layer shows how adaptive runtime changes stabilize it.
            </p>
          </div>

          <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--color-background-secondary)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, fontSize: 12, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>Component</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, fontSize: 12, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>Paper contribution</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, fontSize: 12, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>Section</th>
                </tr>
              </thead>
              <tbody>
                {PAPER_MAP.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < PAPER_MAP.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-primary)" }}>{row.component}</td>
                    <td style={{ padding: "10px 14px", color: "var(--color-text-secondary)", fontSize: 12 }}>{row.contribution}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap",
                        background: row.section === "Core Contribution" ? colorMap.teal.bg : "var(--color-background-secondary)",
                        color: row.section === "Core Contribution" ? colorMap.teal.text : "var(--color-text-secondary)",
                        border: row.section === "Core Contribution" ? `0.5px solid ${colorMap.teal.border}` : "0.5px solid var(--color-border-tertiary)",
                        fontWeight: row.section === "Core Contribution" ? 500 : 400
                      }}>{row.section}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Every engineering hour", value: "advances paper methodology", color: "blue" },
              { label: "Telemetry correlation", value: "IS the thesis evidence", color: "coral" },
              { label: "Contention injector", value: "reproducible hypothesis tests", color: "purple" },
              { label: "Policy layer stays separate", value: "clean novel contribution boundary", color: "teal" },
            ].map((item, i) => (
              <div key={i} style={{
                padding: "12px 14px",
                background: colorMap[item.color].bg,
                borderRadius: "var(--border-radius-md)",
                border: `0.5px solid ${colorMap[item.color].border}`,
              }}>
                <p style={{ margin: "0 0 2px", fontSize: 11, color: colorMap[item.color].text, fontWeight: 500 }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 13, color: colorMap[item.color].text }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
