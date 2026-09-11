"use client";

import type { HumanDesignResult } from "@/app/api/human-design/route";
import Tooltip from "@/components/Tooltip";
import BodyGraph from "@/components/BodyGraph";
import ExpandableSection from "@/components/ExpandableSection";
import { getTooltipProps, getValueDesc } from "@/utils/glossary";

interface Props {
  result: HumanDesignResult;
  captureMode?: boolean;
}

// Color system per Human Design type
const TYPE_COLORS: Record<string, string> = {
  "Generator":             "text-green-400 bg-green-500/10 border-green-500/40",
  "Manifesting Generator": "text-emerald-400 bg-emerald-500/10 border-emerald-500/40",
  "Projector":             "text-blue-400 bg-blue-500/10 border-blue-500/40",
  "Manifestor":            "text-purple-400 bg-purple-500/10 border-purple-500/40",
  "Reflector":             "text-amber-400 bg-amber-500/10 border-amber-500/40",
};

// Chinese type names (official translations)
export const TYPE_CN: Record<string, string> = {
  "Generator":             "生產者",
  "Manifesting Generator": "顯示生產者",
  "Projector":             "投射者",
  "Manifestor":            "顯示者",
  "Reflector":             "反映者",
};

// 9 centers in display order (body anatomy top → bottom)
export const CENTER_DISPLAY_ORDER = [
  "Head", "Ajna", "Throat", "G", "Heart",
  "Sacral", "Solar Plexus", "Spleen", "Root",
];

// Chinese names for centers
export const CENTER_LABELS: Record<string, string> = {
  "Head":         "頭腦中心",
  "Ajna":         "直覺中心",
  "Throat":       "喉嚨中心",
  "G":            "G 中心",
  "Heart":        "心臟中心",
  "Sacral":       "薦骨中心",
  "Solar Plexus": "太陽神經叢",
  "Spleen":       "脾臟中心",
  "Root":         "根部中心",
};

function InfoBlock({
  label,
  value,
  dimIfEmpty = false,
  fieldKey,
  valueKey,
}: {
  label: string;
  value: string;
  dimIfEmpty?: boolean;
  fieldKey?: string;
  valueKey?: string;
}) {
  const isEmpty = !value;
  const tooltipProps = fieldKey ? getTooltipProps(fieldKey, valueKey) : {};

  return (
    <div className="bg-slate-800 rounded-lg p-3">
      <dt className="text-slate-500 text-xs mb-1">
        <Tooltip {...tooltipProps}>
          <span>{label}</span>
        </Tooltip>
      </dt>
      <dd className={`font-medium text-sm ${isEmpty && dimIfEmpty ? "text-slate-600 italic" : "text-white"}`}>
        {isEmpty && dimIfEmpty ? "（資料不足）" : (value || "—")}
      </dd>
    </div>
  );
}

export default function HumanDesignCard({ result, captureMode }: Props) {
  const typeColorClass = TYPE_COLORS[result.type] ?? "text-slate-300 bg-slate-700/30 border-slate-600/40";

  // Build centers map for quick lookup
  const centersMap = new Map(result.centers.map((c) => [c.name, c.defined]));

  // Resolve notSelf / signature glossary keys
  const notSelfKey = `hd.value.notSelf.${result.notSelf}`;
  const signatureKey = `hd.value.signature.${result.signature}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      {/* Header */}
      <h2 className="text-base font-semibold text-cyan-400 mb-4">人類圖分析</h2>

      {/* BodyGraph visualization */}
      {result.centers.length > 0 && result.gates.length > 0 && (
        <div className="mb-4">
          <BodyGraph
            centers={result.centers}
            gates={result.gates}
            channels={result.channels}
          />
        </div>
      )}

      {/* Type — large prominent badge */}
      <div className={`border rounded-xl px-4 py-3 mb-4 text-center ${typeColorClass}`}>
        <span className="block text-xs text-slate-400 mb-1">
          <Tooltip {...getTooltipProps("hd.field.type", `hd.value.${result.type}`)}>
            <span>人類圖類型</span>
          </Tooltip>
        </span>
        <p className="text-xl font-bold">{result.type || "—"}</p>
        {TYPE_CN[result.type] && (
          <p className="text-sm text-slate-400 mt-0.5">{TYPE_CN[result.type]}</p>
        )}
      </div>

      {/* Strategy + Authority */}
      <dl className="grid grid-cols-2 gap-3 mb-3">
        <InfoBlock
          label="策略"
          value={result.strategy}
          dimIfEmpty
          fieldKey="hd.field.strategy"
          valueKey={`hd.value.${result.strategy}`}
        />
        <InfoBlock
          label="權威"
          value={result.authority}
          dimIfEmpty
          fieldKey="hd.field.authority"
          valueKey={`hd.value.${result.authority}`}
        />
      </dl>

      {/* Profile + Gates/Channels */}
      <dl className="grid grid-cols-2 gap-3 mb-3">
        <InfoBlock
          label="人格線（Profile）"
          value={result.profile}
          fieldKey="hd.field.profile"
          valueKey={`hd.value.profile.${result.profile}`}
        />
        <InfoBlock
          label="Gates / Channels"
          value={`${result.gates.length} Gates | ${result.channels.length} Channels`}
          fieldKey="hd.field.gatesChannels"
        />
      </dl>

      {/* NotSelf + Signature */}
      <dl className="grid grid-cols-2 gap-3 mb-4">
        <InfoBlock
          label="非自我主題"
          value={result.notSelf}
          dimIfEmpty
          fieldKey="hd.field.notSelf"
          valueKey={getValueDesc(notSelfKey) ? notSelfKey : undefined}
        />
        <InfoBlock
          label="活在設計中的感受"
          value={result.signature}
          dimIfEmpty
          fieldKey="hd.field.signature"
          valueKey={getValueDesc(signatureKey) ? signatureKey : undefined}
        />
      </dl>

      {/* Centers */}
      {result.centers.length > 0 && (
        <div>
          <span className="block text-slate-500 text-xs mb-2">
            <Tooltip fieldDesc={getTooltipProps("hd.field.centers").fieldDesc}>
              <span>能量中心（實心 = 已定義，空心 = 開放）</span>
            </Tooltip>
          </span>
          <div className="grid grid-cols-3 gap-2">
            {CENTER_DISPLAY_ORDER.map((name) => {
              const defined = centersMap.get(name) ?? false;
              const state = defined ? "defined" : "open";
              const centerTooltip = getValueDesc(`hd.value.center.${name}.${state}`);

              return (
                <div
                  key={name}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                    defined
                      ? "bg-slate-700 text-white"
                      : "bg-slate-800/50 text-slate-500"
                  }`}
                >
                  {/* Circle indicator */}
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      defined
                        ? "bg-cyan-400"
                        : "border border-slate-500"
                    }`}
                  />
                  <Tooltip valueDesc={centerTooltip}>
                    <span>{CENTER_LABELS[name] ?? name}</span>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expandable detailed interpretation */}
      <ExpandableSection title="📖 人類圖解讀" forceOpen={captureMode}>
        {/* Type */}
        {result.type && (
          <div className="text-slate-300">
            <p className="font-medium text-slate-200 text-xs">
              類型：{result.type}{TYPE_CN[result.type] ? `（${TYPE_CN[result.type]}）` : ""}
            </p>
            <p className="ml-3 text-xs text-slate-500 mt-0.5">
              類型是人類圖中最基本的分類，決定了你的能量運作方式和最適合的行動模式。
            </p>
            {getValueDesc(`hd.value.${result.type}`) && (
              <p className="ml-3 text-xs text-slate-400 mt-0.5">
                {getValueDesc(`hd.value.${result.type}`)}
              </p>
            )}
          </div>
        )}

        {/* Strategy */}
        {result.strategy && (
          <div className="text-slate-300">
            <p className="font-medium text-slate-200 text-xs">
              策略：{result.strategy}
            </p>
            <p className="ml-3 text-xs text-slate-500 mt-0.5">
              策略是你做決定和行動時最省力的方式。跟隨策略可以減少人生中不必要的阻力和摩擦。
            </p>
            {getValueDesc(`hd.value.${result.strategy}`) && (
              <p className="ml-3 text-xs text-slate-400 mt-0.5">
                {getValueDesc(`hd.value.${result.strategy}`)}
              </p>
            )}
          </div>
        )}

        {/* Authority */}
        {result.authority && (
          <div className="text-slate-300">
            <p className="font-medium text-slate-200 text-xs">
              內在權威：{result.authority}
            </p>
            <p className="ml-3 text-xs text-slate-500 mt-0.5">
              內在權威是你的「內建決策系統」。每個人都有不同的最佳決策方式，跟隨你的權威做選擇，會讓人生更順暢。
            </p>
            {getValueDesc(`hd.value.${result.authority}`) && (
              <p className="ml-3 text-xs text-slate-400 mt-0.5">
                {getValueDesc(`hd.value.${result.authority}`)}
              </p>
            )}
          </div>
        )}

        {/* Profile */}
        {result.profile && (
          <div className="text-slate-300">
            <p className="font-medium text-slate-200 text-xs">
              人格線：{result.profile}
            </p>
            <p className="ml-3 text-xs text-slate-500 mt-0.5">
              人格線描述你與世界互動的方式。兩個數字分別代表你的「意識面」（自己知道的）和「潛意識面」（別人看到的），兩者結合構成你的人生角色。
            </p>
            {getValueDesc(`hd.value.profile.${result.profile}`) && (
              <p className="ml-3 text-xs text-slate-400 mt-0.5">
                {getValueDesc(`hd.value.profile.${result.profile}`)}
              </p>
            )}
          </div>
        )}

        {/* NotSelf + Signature together */}
        <div className="text-slate-300">
          <p className="font-medium text-slate-200 text-xs">情緒指標</p>
          <p className="ml-3 text-xs text-slate-500 mt-0.5">
            人類圖用兩種感受作為你是否「活出自己」的指標：非自我主題是偏離設計時的警訊，設計中的感受則是走在對的路上時的確認。
          </p>
          {result.notSelf && (
            <div className="ml-3 mt-1">
              <p className="text-xs text-slate-400">
                <span className="text-red-400/70">⚠ 非自我主題：{result.notSelf}</span>
                {getValueDesc(`hd.value.notSelf.${result.notSelf}`) && (
                  <span className="block ml-3 text-slate-500 mt-0.5">
                    {getValueDesc(`hd.value.notSelf.${result.notSelf}`)}
                  </span>
                )}
              </p>
            </div>
          )}
          {result.signature && (
            <div className="ml-3 mt-1">
              <p className="text-xs text-slate-400">
                <span className="text-green-400/70">✓ 設計中的感受：{result.signature}</span>
                {getValueDesc(`hd.value.signature.${result.signature}`) && (
                  <span className="block ml-3 text-slate-500 mt-0.5">
                    {getValueDesc(`hd.value.signature.${result.signature}`)}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Centers */}
        {result.centers.length > 0 && (
          <div className="text-slate-300">
            <p className="font-medium text-slate-200 text-xs mb-0.5">能量中心</p>
            <p className="ml-3 text-xs text-slate-500 mb-1">
              人體有 9 個能量中心。已定義（實心）代表穩定運作的能量，是你可以依賴的；開放（空心）代表會受環境和他人影響的部分，是你需要覺察的。
            </p>
            {CENTER_DISPLAY_ORDER.map((name) => {
              const defined = centersMap.get(name) ?? false;
              const state = defined ? "defined" : "open";
              const desc = getValueDesc(`hd.value.center.${name}.${state}`);
              return (
                <div key={name} className="ml-3 text-xs text-slate-400 mb-1">
                  <span className={defined ? "text-cyan-400" : "text-slate-500"}>
                    {CENTER_LABELS[name] ?? name}
                  </span>
                  <span className="text-slate-600">（{defined ? "已定義" : "開放"}）</span>
                  {desc && <span> — {desc}</span>}
                </div>
              );
            })}
          </div>
        )}
      </ExpandableSection>

    </div>
  );
}
