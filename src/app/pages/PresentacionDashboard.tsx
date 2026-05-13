import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  TrendingUp,
  Target,
  Briefcase,
} from "lucide-react";
import { apuestas, okrs, proyectos, metas } from "../data/mockData";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  white: "#FFFFFF",
  bg: "#0A0A0F",
  surface: "rgba(255,255,255,0.04)",
  surfaceHi: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  textDim: "rgba(255,255,255,0.5)",
  textMuted: "rgba(255,255,255,0.35)",
};

const SLIDE_COUNT = apuestas.length + 2;

function getApuestaColor(idx: number): string {
  return [COLORS.blue, COLORS.green, COLORS.orange][idx % 3];
}

function getSemaforo(pct: number): string {
  return pct >= 70 ? COLORS.green : pct >= 40 ? COLORS.yellow : COLORS.orange;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: COLORS.textMuted,
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        fontWeight: 600,
      }}
    >
      {children}
    </p>
  );
}

function BigProgressRing({
  value,
  color,
  size = 180,
}: {
  value: number;
  color: string;
  size?: number;
}) {
  const stroke = size * 0.1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#grad-${color})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.4s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: size * 0.22,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {value}
          <span style={{ fontSize: size * 0.12, color: COLORS.textDim }}>%</span>
        </span>
        <span
          style={{
            fontSize: size * 0.06,
            color: COLORS.textMuted,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginTop: 6,
          }}
        >
          Cumplimiento
        </span>
      </div>
    </div>
  );
}

// ── Slide 0: Portada ─────────────────────────────────────────────────────────
function SlidePortada() {
  const cumProm = Math.round(
    apuestas.reduce((s, a) => s + a.cumplimiento, 0) / apuestas.length
  );
  const proyActivos = proyectos.filter((p) => p.estado === "activo").length;

  const deptData = [
    { dept: "DCSI", cumplimiento: 68 },
    { dept: "DDI", cumplimiento: 45 },
    { dept: "DM", cumplimiento: 33 },
    { dept: "Dir. TDI", cumplimiento: 72 },
  ];

  return (
    <div className="flex h-full">
      {/* Left: branding */}
      <div
        className="flex flex-col justify-between p-14 relative overflow-hidden"
        style={{
          width: "42%",
          background:
            "linear-gradient(135deg, #5454E9 0%, #3D3DBF 60%, #2D2D8F 100%)",
        }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* Soft blob */}
        <div
          className="absolute rounded-full blur-3xl opacity-25"
          style={{
            width: 520,
            height: 520,
            background: COLORS.yellow,
            bottom: -200,
            right: -160,
          }}
        />

        {/* Top */}
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <Sparkles size={12} color={COLORS.yellow} />
            <span
              style={{
                color: "#fff",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Universidad ICESI · Escuela TDI
            </span>
          </div>
          <div className="flex gap-1 mt-6">
            {["#E4EB60", "#4CB979", "#E9683B", "#fff"].map((c, i) => (
              <div
                key={i}
                style={{
                  height: 3,
                  width: 32,
                  backgroundColor: c,
                  borderRadius: 2,
                  opacity: 0.9 - i * 0.1,
                }}
              />
            ))}
          </div>
        </div>

        {/* Center */}
        <div className="relative z-10">
          <h1
            style={{
              color: "#fff",
              fontSize: "44px",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              marginBottom: 20,
            }}
          >
            Sistema de
            <br />
            Gestión de
            <br />
            Proyectos
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "15px",
              lineHeight: 1.65,
              maxWidth: 360,
            }}
          >
            Trazabilidad estratégica de apuestas, OKRs y proyectos de la
            Escuela de Tecnología, Diseño e Innovación.
          </p>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-end justify-between">
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Periodo 2025 — 2026
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", marginTop: 4 }}>
              SGP v1.0 · Confidencial
            </p>
          </div>
        </div>
      </div>

      {/* Right: data */}
      <div
        className="flex-1 flex flex-col p-12 gap-7"
        style={{ backgroundColor: COLORS.bg }}
      >
        <div>
          <SectionLabel>Resumen ejecutivo</SectionLabel>
          <h2
            style={{
              color: "#fff",
              fontSize: "26px",
              fontWeight: 700,
              marginTop: 8,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Estado del portafolio estratégico
          </h2>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Apuestas activas",
              value: apuestas.filter((a) => a.estado === "activa").length,
              color: COLORS.yellow,
              icon: Target,
              unit: "",
            },
            {
              label: "Cumplimiento promedio",
              value: cumProm,
              color: COLORS.green,
              icon: TrendingUp,
              unit: "%",
            },
            {
              label: "Proyectos activos",
              value: proyActivos,
              color: COLORS.blue,
              icon: Briefcase,
              unit: "",
            },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-xl p-5"
                style={{
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: `${kpi.color}1A`,
                    }}
                  >
                    <Icon size={14} color={kpi.color} />
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "36px",
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1,
                    letterSpacing: "-0.025em",
                  }}
                >
                  {kpi.value}
                  <span style={{ color: kpi.color, fontSize: "22px" }}>
                    {kpi.unit}
                  </span>
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: COLORS.textDim,
                    marginTop: 8,
                    fontWeight: 500,
                  }}
                >
                  {kpi.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Apuestas semáforo */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Apuestas estratégicas</SectionLabel>
            <span style={{ fontSize: "10px", color: COLORS.textMuted }}>
              {apuestas.length} en curso
            </span>
          </div>
          <div className="space-y-3.5">
            {apuestas.map((a, i) => {
              const sem = getSemaforo(a.cumplimiento);
              const okrsApuesta = okrs.filter((o) => o.apuestaId === a.id);
              return (
                <div key={a.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: sem,
                          flexShrink: 0,
                          boxShadow: `0 0 0 3px ${sem}25`,
                        }}
                      />
                      <span
                        style={{
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: 500,
                        }}
                      >
                        {a.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          fontSize: "10px",
                          color: COLORS.textMuted,
                        }}
                      >
                        {okrsApuesta.length} OKRs
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: sem,
                          minWidth: 42,
                          textAlign: "right",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {a.cumplimiento}%
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 4,
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: 99,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${a.cumplimiento}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${sem}AA, ${sem})`,
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dept bars */}
        <div style={{ height: 130 }}>
          <SectionLabel>Cumplimiento por departamento</SectionLabel>
          <svg
            viewBox="0 0 600 110"
            width="100%"
            height="100"
            preserveAspectRatio="none"
            style={{ marginTop: 8 }}
          >
            {[0, 50, 100].map((g) => {
              const y = 90 - (g / 100) * 80;
              return (
                <g key={`pdg-${g}`}>
                  <line
                    x1={40}
                    y1={y}
                    x2={590}
                    y2={y}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={1}
                    strokeDasharray={g === 0 ? "0" : "2 4"}
                  />
                  <text
                    x={36}
                    y={y + 3}
                    fontSize={9}
                    fill={COLORS.textMuted}
                    textAnchor="end"
                  >
                    {g}
                  </text>
                </g>
              );
            })}
            {deptData.map((d, i) => {
              const slot = 550 / deptData.length;
              const bw = slot * 0.5;
              const x = 40 + slot * i + (slot - bw) / 2;
              const h = (d.cumplimiento / 100) * 80;
              const color = getSemaforo(d.cumplimiento);
              return (
                <g key={`pdb-${d.dept}`}>
                  <rect
                    x={x}
                    y={90 - h}
                    width={bw}
                    height={h}
                    fill={color}
                    rx={3}
                    opacity={0.9}
                  />
                  <text
                    x={x + bw / 2}
                    y={104}
                    fontSize={10}
                    fill={COLORS.textDim}
                    textAnchor="middle"
                    fontWeight={500}
                  >
                    {d.dept}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Slide Apuesta ─────────────────────────────────────────────────────────────
function SlideApuesta({
  apuesta,
  idx,
}: {
  apuesta: typeof apuestas[0];
  idx: number;
}) {
  const color = getApuestaColor(idx);
  const sem = getSemaforo(apuesta.cumplimiento);
  const okrsApuesta = okrs.filter((o) => o.apuestaId === apuesta.id);
  const okrIdsSet = new Set(okrsApuesta.map((o) => o.id));
  const proyectosApuesta = proyectos.filter((p) =>
    p.okrIds.some((oid) => okrIdsSet.has(oid))
  );
  const metasApuesta = [...new Set(okrsApuesta.map((o) => o.metaId))]
    .map((mid) => metas.find((m) => m.id === mid))
    .filter((m): m is NonNullable<typeof m> => !!m);

  const okrsBuenos = okrsApuesta.filter((o) => o.cumplimiento >= 70).length;
  const okrsRiesgo = okrsApuesta.filter((o) => o.cumplimiento < 40).length;

  return (
    <div className="flex h-full" style={{ backgroundColor: COLORS.bg }}>
      {/* Left panel */}
      <div
        className="flex flex-col justify-between p-12 relative overflow-hidden"
        style={{
          width: "42%",
          background: `linear-gradient(160deg, ${color}1F 0%, ${color}08 50%, transparent 100%)`,
          borderRight: `1px solid ${COLORS.border}`,
        }}
      >
        {/* Decorative number */}
        <div
          style={{
            position: "absolute",
            right: -30,
            top: -20,
            fontSize: "240px",
            fontWeight: 700,
            color: color,
            opacity: 0.05,
            lineHeight: 1,
            userSelect: "none",
            letterSpacing: "-0.05em",
          }}
        >
          {String(idx + 1).padStart(2, "0")}
        </div>

        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{
              backgroundColor: `${color}1F`,
              border: `1px solid ${color}40`,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: color,
              }}
            />
            <span
              style={{
                fontSize: "10px",
                color: color,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Apuesta {idx + 1} de {apuestas.length}
            </span>
          </div>
          <h2
            style={{
              color: "#fff",
              fontSize: "30px",
              fontWeight: 700,
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              marginBottom: 14,
            }}
          >
            {apuesta.nombre}
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              lineHeight: 1.65,
            }}
          >
            {apuesta.descripcion}
          </p>
          <p
            style={{
              color: COLORS.textMuted,
              fontSize: "11px",
              marginTop: 16,
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            {apuesta.areaInstitucional}
          </p>
        </div>

        <div className="flex justify-center relative z-10">
          <BigProgressRing value={apuesta.cumplimiento} color={sem} size={200} />
        </div>

        <div className="grid grid-cols-3 gap-3 relative z-10">
          {[
            { label: "OKRs activos", value: okrsApuesta.length, color: COLORS.blue },
            { label: "En meta", value: okrsBuenos, color: COLORS.green },
            { label: "En riesgo", value: okrsRiesgo, color: COLORS.orange },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center p-3 rounded-lg"
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <p
                style={{
                  fontSize: "26px",
                  fontWeight: 700,
                  color: s.color,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontSize: "9px",
                  color: COLORS.textMuted,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  marginTop: 6,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col p-10 gap-7 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Metas institucionales</SectionLabel>
            <span style={{ fontSize: "10px", color: COLORS.textMuted }}>
              {metasApuesta.length} vinculadas
            </span>
          </div>
          <div className="space-y-2">
            {metasApuesta.map((meta) => (
              <div
                key={meta.id}
                className="rounded-lg p-3.5"
                style={{
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>
                  {meta.nombre}
                </p>
                <p
                  style={{
                    color: COLORS.textDim,
                    fontSize: "11px",
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {meta.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Objetivos vinculados</SectionLabel>
            <span style={{ fontSize: "10px", color: COLORS.textMuted }}>
              {okrsApuesta.length} OKRs
            </span>
          </div>
          <div className="space-y-2">
            {okrsApuesta.map((okr) => {
              const oColor = getSemaforo(okr.cumplimiento);
              return (
                <div
                  key={okr.id}
                  className="flex items-center gap-4 p-3 rounded-lg"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: `${oColor}1A`,
                      border: `1px solid ${oColor}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: oColor,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {okr.cumplimiento}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {okr.objetivo}
                    </p>
                    <p
                      style={{
                        color: COLORS.textMuted,
                        fontSize: "10px",
                        marginTop: 2,
                      }}
                    >
                      {okr.departamento} · {okr.periodo}
                    </p>
                  </div>
                  <div style={{ width: 70, flexShrink: 0 }}>
                    <div
                      style={{
                        height: 4,
                        backgroundColor: "rgba(255,255,255,0.06)",
                        borderRadius: 99,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${okr.cumplimiento}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, ${oColor}AA, ${oColor})`,
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="flex items-center gap-5 p-5 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${color}14, ${color}06)`,
            border: `1px solid ${color}30`,
          }}
        >
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 44,
              height: 44,
              backgroundColor: `${color}25`,
            }}
          >
            <Briefcase size={18} color={color} />
          </div>
          <div className="flex-1">
            <p
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {proyectosApuesta.length}
              <span
                style={{
                  fontSize: "12px",
                  color: COLORS.textDim,
                  fontWeight: 500,
                  marginLeft: 8,
                }}
              >
                proyectos vinculados
              </span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: COLORS.green,
              }}
            >
              {proyectosApuesta.filter((p) => p.estado === "activo").length} activos
            </p>
            <p
              style={{
                fontSize: "10px",
                color: COLORS.textMuted,
                marginTop: 2,
              }}
            >
              {proyectosApuesta.filter((p) => p.estado === "finalizado").length} finalizados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Slide Cierre ─────────────────────────────────────────────────────────────
function SlideCierre() {
  const cumProm = Math.round(
    apuestas.reduce((s, a) => s + a.cumplimiento, 0) / apuestas.length
  );
  const proyActivos = proyectos.filter((p) => p.estado === "activo").length;
  const proyFinalizados = proyectos.filter((p) => p.estado === "finalizado").length;
  const okrsActivos = okrs.filter((o) => o.estado === "activo").length;

  return (
    <div
      className="flex flex-col items-center justify-center h-full text-center px-16 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%)",
      }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Soft blobs */}
      <div
        className="absolute rounded-full blur-3xl opacity-15"
        style={{
          width: 500,
          height: 500,
          background: COLORS.blue,
          top: -150,
          left: -150,
        }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-10"
        style={{
          width: 400,
          height: 400,
          background: COLORS.yellow,
          bottom: -100,
          right: -100,
        }}
      />

      <div className="relative z-10 max-w-3xl">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Sparkles size={12} color={COLORS.yellow} />
          <span
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            Gracias por su atención
          </span>
        </div>

        <h1
          style={{
            color: "#fff",
            fontSize: "56px",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 20,
          }}
        >
          Escuela TDI
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${COLORS.yellow}, ${COLORS.green})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            en marcha.
          </span>
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "16px",
            lineHeight: 1.65,
            maxWidth: 560,
            margin: "0 auto 56px",
          }}
        >
          Construyendo el futuro de la ingeniería, el diseño y la innovación
          en la Universidad ICESI.
        </p>

        <div className="grid grid-cols-4 gap-4 max-w-3xl mx-auto mb-14">
          {[
            { label: "Cumplimiento", value: `${cumProm}%`, color: getSemaforo(cumProm) },
            { label: "Proyectos activos", value: proyActivos, color: COLORS.blue },
            { label: "Proyectos finalizados", value: proyFinalizados, color: COLORS.green },
            { label: "OKRs en seguimiento", value: okrsActivos, color: COLORS.yellow },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-5"
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                backdropFilter: "blur(10px)",
              }}
            >
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: 700,
                  color: s.color,
                  lineHeight: 1,
                  letterSpacing: "-0.025em",
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: COLORS.textDim,
                  marginTop: 10,
                  fontWeight: 500,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-1.5 mb-6">
          {["#E4EB60", "#4CB979", "#E9683B", "#5454E9"].map((c, i) => (
            <div
              key={i}
              style={{
                width: 32,
                height: 3,
                backgroundColor: c,
                borderRadius: 2,
              }}
            />
          ))}
        </div>

        <p style={{ color: COLORS.textMuted, fontSize: "11px", letterSpacing: "0.04em" }}>
          Universidad ICESI · Sistema de Gestión de Proyectos · SGP v1.0 · 2026
        </p>
      </div>
    </div>
  );
}

// ── Navigation dots ───────────────────────────────────────────────────────────
function NavDots({
  current,
  total,
  onGo,
}: {
  current: number;
  total: number;
  onGo: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onGo(i)}
          style={{
            width: current === i ? 24 : 6,
            height: 6,
            borderRadius: 99,
            backgroundColor:
              current === i ? COLORS.yellow : "rgba(255,255,255,0.2)",
            transition: "all 0.25s ease",
            cursor: "pointer",
            border: "none",
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PresentacionDashboard() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const goNext = useCallback(
    () => setSlide((s) => Math.min(s + 1, SLIDE_COUNT - 1)),
    []
  );
  const goPrev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        navigate("/dashboard");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, navigate]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not allowed
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const slideLabel =
    slide === 0
      ? "Portada"
      : slide === SLIDE_COUNT - 1
      ? "Cierre"
      : `Apuesta ${slide} de ${apuestas.length}`;

  const progressPct = ((slide + 1) / SLIDE_COUNT) * 100;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Montserrat, sans-serif",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
        zIndex: 9999,
      }}
    >
      {/* Top progress bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: "rgba(255,255,255,0.05)",
          zIndex: 100,
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.yellow})`,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Slide content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {slide === 0 && <SlidePortada />}
        {apuestas.map(
          (a, i) =>
            slide === i + 1 && <SlideApuesta key={a.id} apuesta={a} idx={i} />
        )}
        {slide === SLIDE_COUNT - 1 && <SlideCierre />}
      </div>

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-8 py-4"
        style={{
          backgroundColor: "rgba(0,0,0,0.7)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 transition-opacity hover:opacity-100"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "11px",
              fontWeight: 500,
              opacity: 0.7,
            }}
          >
            <X size={13} />
            Salir
            <span
              style={{
                fontSize: "9px",
                padding: "2px 5px",
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.08)",
                marginLeft: 2,
                fontFamily: "monospace",
              }}
            >
              ESC
            </span>
          </button>
          <div style={{ width: 1, height: 16, backgroundColor: "rgba(255,255,255,0.08)" }} />
          <span
            style={{
              color: COLORS.textMuted,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 500,
            }}
          >
            SGP · Escuela TDI · 2025–2026
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <NavDots current={slide} total={SLIDE_COUNT} onGo={setSlide} />
          <p
            style={{
              color: COLORS.textMuted,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 500,
            }}
          >
            {slideLabel} ·{" "}
            <span style={{ color: "rgba(255,255,255,0.55)" }}>
              {slide + 1}/{SLIDE_COUNT}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: 34,
              height: 34,
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
            }}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={goPrev}
            disabled={slide === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: slide === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: slide === 0 ? "not-allowed" : "pointer",
            }}
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <button
            onClick={goNext}
            disabled={slide === SLIDE_COUNT - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor:
                slide === SLIDE_COUNT - 1 ? "rgba(255,255,255,0.04)" : COLORS.blue,
              color: slide === SLIDE_COUNT - 1 ? "rgba(255,255,255,0.2)" : "#fff",
              fontSize: "12px",
              fontWeight: 600,
              cursor: slide === SLIDE_COUNT - 1 ? "not-allowed" : "pointer",
              boxShadow:
                slide === SLIDE_COUNT - 1
                  ? "none"
                  : `0 4px 12px ${COLORS.blue}40`,
            }}
          >
            Siguiente <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
