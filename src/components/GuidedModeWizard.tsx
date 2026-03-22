import { useState, useEffect, useRef } from 'react';
import { SliderWithButtons } from './ui/SliderWithButtons';
import type { DoughMode, YeastType } from '../types/dough';
import { calculateGuided } from '../engine/guidedModeEngine';
import type { GuidedResult as GResult, GuidedParams } from '../engine/guidedModeEngine';
import { GuidedResult } from './GuidedResult';
import { useDoughStore } from '../store/useDoughStore';
import { getDefaultState } from '../constants/modes';
import { DAYS } from '../utils/cookingSchedule';

// ── Dati step ────────────────────────────────────────────────────────────────

const MODES = [
  { id: 'napoletana' as DoughMode, emoji: '🍕', label: 'Napoletana', sub: 'Disciplinare AVPN' },
  { id: 'teglia'     as DoughMode, emoji: '🫓', label: 'Teglia',     sub: 'Stile Bonci' },
  { id: 'pane'       as DoughMode, emoji: '🍞', label: 'Pane',       sub: 'Lievitazione lunga' },
];

const YEAST_OPTS = [
  { id: 'fresh',       emoji: '🍺', label: 'Fresco',   sub: 'Cubetto LdB 25g' },
  { id: 'instant_dry', emoji: '✨', label: 'Secco',    sub: 'IDY (es. Caputo)' },
  { id: 'naturale',    emoji: '🍶', label: 'Naturale', sub: 'Madre / Li.Co.Li' },
];

const PREF_OPTS = [
  { id: 'none',    emoji: '➖', label: 'Nessuno',  sub: 'Impasto diretto' },
  { id: 'biga',    emoji: '🧱', label: 'Biga',     sub: 'Metodo Giorilli 18h' },
  { id: 'poolish', emoji: '💧', label: 'Poolish',  sub: 'Metodo francese 12h' },
];

const DEFAULT_PIECES: Record<DoughMode, number> = { napoletana: 4, teglia: 2, pane: 1 };

// ── Tipi ─────────────────────────────────────────────────────────────────────

type YeastMain = 'fresh' | 'instant_dry' | 'naturale';
type PrefOpt = 'none' | 'biga' | 'poolish';

interface WizardAnswers {
  mode: DoughMode | null;
  pieces: number;
  ambientTemp: number;
  yeastMain: YeastMain | null;
  yeastSub: 'madre' | 'licoli';
  usesFridge: boolean | null;
  staglioAFreddo: boolean | null;
  prefermento: PrefOpt | null;
  totalHours: number;
  cookingDay: number;
  cookingTime: number;
}

const INITIAL_ANSWERS: WizardAnswers = {
  mode: null, pieces: 4, ambientTemp: 22,
  yeastMain: null, yeastSub: 'madre',
  usesFridge: null, staglioAFreddo: null, prefermento: null, totalHours: 24,
  cookingDay: 5, cookingTime: 1200,
};

function getYeastType(a: WizardAnswers): YeastType {
  if (a.yeastMain === 'naturale') return a.yeastSub;
  return (a.yeastMain ?? 'fresh') as YeastType;
}

// ── Helper UI ─────────────────────────────────────────────────────────────────

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
      done ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white'
    }`}>
      {done ? '✓' : n}
    </div>
  );
}

interface StepCardProps {
  n: number;
  title: string;
  done: boolean;
  doneLabel?: string;
  onEdit?: () => void;
  children?: React.ReactNode;
}

function StepCard({ n, title, done, doneLabel, onEdit, children }: StepCardProps) {
  return (
    <div className="bg-white/80 dark:bg-[#1C2548]/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40 dark:border-[#616B8F]/20 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <StepBadge n={n} done={done} />
        {done ? (
          <>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">{title}</span>
            <button
              onClick={onEdit}
              className="flex-1 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-[#0A1228]/60 rounded-xl px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors truncate"
            >
              {doneLabel} <span className="text-[10px] text-gray-400 ml-1">✏️ modifica</span>
            </button>
          </>
        ) : (
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        )}
      </div>
      {!done && children && (
        <div className="px-5 pb-5">{children}</div>
      )}
    </div>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────

export function GuidedModeWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep]     = useState(1);
  const [result, setResult] = useState<GResult | null>(null);
  const endRef              = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<WizardAnswers>(INITIAL_ANSWERS);

  useEffect(() => {
    if (step > 1) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }, [step]);

  const advance = (n: number, patch: Partial<WizardAnswers>) => {
    setAnswers(prev => ({ ...prev, ...patch }));
    setStep(n);
  };

  // Torna allo step n, azzerando le risposte successive
  const goBack = (n: number) => {
    setResult(null);
    setAnswers(prev => {
      const a = { ...prev };
      if (n <= 1) { a.mode = null; a.pieces = 4; }
      if (n <= 2) { a.pieces = a.mode ? DEFAULT_PIECES[a.mode] : 4; }
      if (n <= 3) { a.ambientTemp = 22; }
      if (n <= 4) { a.yeastMain = null; }
      if (n <= 5) { a.usesFridge = null; a.staglioAFreddo = null; a.prefermento = null; }
      if (n <= 6) { a.staglioAFreddo = null; a.prefermento = null; }
      if (n <= 7) { a.prefermento = null; }
      if (n <= 8) { a.totalHours = 24; }
      return a;
    });
    setStep(n);
  };

  const handleCalculate = () => {
    const params: GuidedParams = {
      mode:          answers.mode!,
      pieces:        answers.pieces,
      ambientTemp:   answers.ambientTemp,
      yeastType:     getYeastType(answers),
      usesFridge:    answers.usesFridge!,
      staglioAFreddo: answers.staglioAFreddo === true,
      prefermento:   answers.prefermento!,
      totalHours:    answers.totalHours,
    };
    setResult(calculateGuided(params));
    setStep(10);
  };

  // Popola lo store avanzato con un unico aggiornamento atomico
  const handleOpenAdvanced = () => {
    if (!result) return;

    const defaultState = getDefaultState(result.mode);
    const guidedMap    = new Map(result.phases.map(p => [p.id, p]));
    const fullPhases   = defaultState.phases.map(def => {
      const guided = guidedMap.get(def.id);
      return guided ? { ...def, ...guided } : { ...def, active: false };
    });

    useDoughStore.setState({
      state: {
        ...defaultState,
        mode:          result.mode,
        pieces:        result.pieces,
        weightPerPiece: result.weightPerPiece,
        hydration:     result.hydration,
        salt:          result.salt,
        oil:           result.oil,
        yeastType:     result.yeastType,
        flours: [{
          id:         crypto.randomUUID(),
          brand:      result.suggestedFlour.brand,
          name:       result.suggestedFlour.name,
          w:          result.suggestedFlour.w,
          percentage: 100,
        }],
        phases: fullPhases,
      },
      cookingDay:  answers.cookingDay,
      cookingTime: answers.cookingTime,
    });
    onClose();
  };

  const hoursLabel = (h: number) => {
    if (h <= 8)  return `${h}h ⚡ Veloce`;
    if (h <= 36) return `${h}h ✓ Standard`;
    return `${h}h ⭐ Lunga maturazione`;
  };

  const isSourdoughSelected = answers.yeastMain === 'naturale';

  if (result && step === 10) {
    return (
      <GuidedResult
        result={result}
        cookingDay={answers.cookingDay}
        cookingTime={answers.cookingTime}
        onReset={() => { setResult(null); setAnswers(INITIAL_ANSWERS); setStep(1); }}
        onOpenAdvanced={handleOpenAdvanced}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-8">

      {step === 1 && (
        <div className="text-center py-4">
          <p className="text-white/70 dark:text-white/50 text-sm">Rispondi a qualche domanda e calcolo tutto io 👨‍🍳</p>
        </div>
      )}

      {/* ① COSA VUOI FARE */}
      <StepCard n={1} title="Cosa vuoi fare?" done={step > 1}
        doneLabel={MODES.find(m => m.id === answers.mode)?.emoji + ' ' + MODES.find(m => m.id === answers.mode)?.label}
        onEdit={() => goBack(1)}>
        <div className="grid grid-cols-3 gap-3">
          {MODES.map(m => (
            <button key={m.id}
              onClick={() => advance(2, { mode: m.id, pieces: DEFAULT_PIECES[m.id] })}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent bg-gray-50 dark:bg-[#0A1228]/60 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all active:scale-95">
              <span className="text-4xl">{m.emoji}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{m.label}</span>
              <span className="text-[10px] text-gray-400">{m.sub}</span>
            </button>
          ))}
        </div>
      </StepCard>

      {/* ② QUANTI PEZZI */}
      {step >= 2 && (
        <StepCard n={2} title="Quanti pezzi?" done={step > 2}
          doneLabel={`${answers.pieces} ${answers.mode === 'napoletana' ? 'palline' : answers.mode === 'teglia' ? 'teglie' : 'pagnotte'}`}
          onEdit={() => goBack(2)}>
          <div className="flex items-center justify-center gap-6">
            <button onClick={() => setAnswers(a => ({ ...a, pieces: Math.max(1, a.pieces - 1) }))}
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#0A1228] text-gray-700 dark:text-white text-2xl font-bold hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">−</button>
            <span className="text-4xl font-bold text-gray-900 dark:text-white w-16 text-center">{answers.pieces}</span>
            <button onClick={() => setAnswers(a => ({ ...a, pieces: Math.min(20, a.pieces + 1) }))}
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#0A1228] text-gray-700 dark:text-white text-2xl font-bold hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">+</button>
          </div>
          <button onClick={() => advance(3, {})}
            className="mt-5 w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors">
            Avanti →
          </button>
        </StepCard>
      )}

      {/* ③ TEMPERATURA AMBIENTE */}
      {step >= 3 && (
        <StepCard n={3} title="Temperatura ambiente?" done={step > 3}
          doneLabel={`${answers.ambientTemp}°C ${answers.ambientTemp <= 18 ? '❄️' : answers.ambientTemp <= 25 ? '🌡️' : '🔥'}`}
          onEdit={() => goBack(3)}>
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-brand-500">{answers.ambientTemp}°C</span>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{
              answers.ambientTemp <= 18 ? '❄️ Fresco — il lievito lavora più lentamente'
              : answers.ambientTemp <= 25 ? '🌡️ Tiepido — condizioni ideali'
              : '🔥 Caldo — attenzione alla fermentazione!'
            }</p>
          </div>
          <SliderWithButtons min={15} max={35} step={1}
            value={answers.ambientTemp}
            onChange={v => setAnswers(a => ({ ...a, ambientTemp: v }))}
            className="accent-brand-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>15°C</span><span>35°C</span></div>
          <button onClick={() => advance(4, {})}
            className="mt-5 w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors">
            Avanti →
          </button>
        </StepCard>
      )}

      {/* ④ TIPO DI LIEVITO */}
      {step >= 4 && (
        <StepCard n={4} title="Che tipo di lievito usi?" done={step > 4}
          doneLabel={
            answers.yeastMain === 'naturale'
              ? `🍶 ${answers.yeastSub === 'madre' ? 'Lievito Madre (idro 50%)' : 'Li.Co.Li (idro 100%)'}`
              : YEAST_OPTS.find(y => y.id === answers.yeastMain)?.emoji + ' ' + YEAST_OPTS.find(y => y.id === answers.yeastMain)?.label
          }
          onEdit={() => goBack(4)}>
          <div className="flex flex-col gap-2">
            {YEAST_OPTS.map(y => (
              <button key={y.id}
                onClick={() => {
                  if (y.id !== 'naturale') advance(5, { yeastMain: y.id as YeastMain });
                  else setAnswers(a => ({ ...a, yeastMain: 'naturale' }));
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  answers.yeastMain === y.id
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-transparent bg-gray-50 dark:bg-[#0A1228]/60 hover:border-brand-300'
                }`}>
                <span className="text-2xl">{y.emoji}</span>
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">{y.label}</div>
                  <div className="text-xs text-gray-400">{y.sub}</div>
                </div>
              </button>
            ))}
            {answers.yeastMain === 'naturale' && (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Tipo di lievito naturale</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'madre', label: '🫙 Madre', sub: 'Idratazione 50%' },
                    { id: 'licoli', label: '💧 Li.Co.Li', sub: 'Idratazione 100%' },
                  ].map(s => (
                    <button key={s.id}
                      onClick={() => setAnswers(a => ({ ...a, yeastSub: s.id as 'madre' | 'licoli' }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        answers.yeastSub === s.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                          : 'border-transparent bg-gray-50 dark:bg-[#0A1228]/60'
                      }`}>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.label}</div>
                      <div className="text-xs text-gray-400">{s.sub}</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => advance(5, {})}
                  className="mt-2 w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors">
                  Avanti →
                </button>
              </div>
            )}
          </div>
        </StepCard>
      )}

      {/* ⑤ FRIGO */}
      {step >= 5 && (
        <StepCard n={5} title="Userai il frigo per la lievitazione?" done={step > 5}
          doneLabel={answers.usesFridge ? '✅ Sì, frigo' : '❌ No, tutto a temperatura ambiente'}
          onEdit={() => goBack(5)}>
          <div className="flex flex-col gap-3">
            {[
              { val: true,  emoji: '✅', label: 'Sì, uso il frigo',       sub: 'Lievitazione più lenta e saporita' },
              { val: false, emoji: '❌', label: 'No, solo a temperatura', sub: 'Più rapido, gestione più semplice' },
            ].map(opt => (
              <button key={String(opt.val)}
                onClick={() => advance(opt.val ? 6 : 7, { usesFridge: opt.val, staglioAFreddo: opt.val ? null : false })}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-gray-50 dark:bg-[#0A1228]/60 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all text-left">
                <span className="text-2xl">{opt.emoji}</span>
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</div>
                  <div className="text-xs text-gray-400">{opt.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </StepCard>
      )}

      {/* ⑥ STAGLIO TIMING (solo se frigo = sì) */}
      {step >= 6 && answers.usesFridge && (
        <StepCard n={6} title="Quando fai lo staglio?" done={step > 6}
          doneLabel={answers.staglioAFreddo ? '⏪ Panetti in frigo' : '⏩ Massa in frigo'}
          onEdit={() => goBack(6)}>
          <div className="flex flex-col gap-3">
            {[
              {
                val: false,
                emoji: '⏩',
                label: 'Staglio dopo il frigo',
                sub: 'La massa intera va in frigo. Staglio e appretto lungo all\'uscita.',
              },
              {
                val: true,
                emoji: '⏪',
                label: 'Staglio prima del frigo',
                sub: 'Formi i panetti, poi vanno in frigo. Appretto breve all\'uscita.',
              },
            ].map(opt => (
              <button key={String(opt.val)}
                onClick={() => advance(7, { staglioAFreddo: opt.val })}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-gray-50 dark:bg-[#0A1228]/60 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all text-left">
                <span className="text-2xl">{opt.emoji}</span>
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</div>
                  <div className="text-xs text-gray-400">{opt.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </StepCard>
      )}

      {/* ⑦ PREFERMENTO */}
      {step >= 7 && (
        <StepCard n={7} title="Vuoi usare un prefermento?" done={step > 7}
          doneLabel={PREF_OPTS.find(p => p.id === answers.prefermento)?.emoji + ' ' + PREF_OPTS.find(p => p.id === answers.prefermento)?.label}
          onEdit={() => goBack(7)}>
          <div className="flex flex-col gap-2">
            {PREF_OPTS.map(p => {
              const disabled = p.id === 'biga' && isSourdoughSelected;
              return (
                <button key={p.id} disabled={disabled}
                  onClick={() => !disabled && advance(8, { prefermento: p.id as PrefOpt })}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    disabled
                      ? 'opacity-35 cursor-not-allowed border-transparent bg-gray-50 dark:bg-[#0A1228]/40'
                      : 'border-transparent bg-gray-50 dark:bg-[#0A1228]/60 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                  }`}>
                  <span className="text-2xl">{p.emoji}</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{p.label}
                      {disabled && <span className="ml-2 text-xs text-gray-400">(non compatibile con lievito naturale)</span>}
                    </div>
                    <div className="text-xs text-gray-400">{p.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </StepCard>
      )}

      {/* ⑧ QUANTE ORE */}
      {step >= 8 && (
        <StepCard n={8} title="Quante ore hai a disposizione?" done={step > 8}
          doneLabel={hoursLabel(answers.totalHours)}
          onEdit={() => goBack(8)}>
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-brand-500">{answers.totalHours}h</span>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{hoursLabel(answers.totalHours)}</p>
          </div>
          <SliderWithButtons min={4} max={72} step={1}
            value={answers.totalHours}
            onChange={v => setAnswers(a => ({ ...a, totalHours: v }))}
            className="accent-brand-500"
          />
          <button onClick={() => advance(9, {})}
            className="mt-5 w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors">
            Avanti →
          </button>
        </StepCard>
      )}

      {/* ⑨ A CHE ORA VUOI INFORNARE */}
      {step >= 9 && (
        <StepCard n={9} title="A che ora vuoi infornare?" done={false}>
          {/* Selezione giorno */}
          <div className="flex gap-1.5 flex-wrap justify-center mb-5">
            {DAYS.map((day, i) => (
              <button
                key={day}
                onClick={() => setAnswers(a => ({ ...a, cookingDay: i }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  answers.cookingDay === i
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-[#0A1228]/60 text-gray-600 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900/30'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Selezione orario */}
          <div className="flex items-center justify-center gap-5 mb-6">
            <button
              onClick={() => {
                const newTime = ((answers.cookingTime - 15) % (24 * 60) + 24 * 60) % (24 * 60);
                setAnswers(a => ({ ...a, cookingTime: newTime }));
              }}
              className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#0A1228] text-gray-700 dark:text-white text-2xl font-bold hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors select-none"
            >
              −
            </button>
            <span className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums w-32 text-center">
              {String(Math.floor(answers.cookingTime / 60)).padStart(2, '0')}:{String(answers.cookingTime % 60).padStart(2, '0')}
            </span>
            <button
              onClick={() => {
                const newTime = (answers.cookingTime + 15) % (24 * 60);
                setAnswers(a => ({ ...a, cookingTime: newTime }));
              }}
              className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#0A1228] text-gray-700 dark:text-white text-2xl font-bold hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors select-none"
            >
              +
            </button>
          </div>

          <button onClick={handleCalculate}
            className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', fontSize: '1rem' }}>
            🍞 CALCOLA INGREDIENTI
          </button>
        </StepCard>
      )}

      <div ref={endRef} />
    </div>
  );
}
