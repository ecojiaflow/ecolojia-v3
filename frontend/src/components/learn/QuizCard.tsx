import React, { useState } from "react";

interface QuizOption { id: string; text: string; correct: boolean; }
interface QuizProps {
  question: string;
  options: QuizOption[];
  feedback: { correct: string; incorrect: string };
  onComplete?: (correct: boolean) => void;
}

export default function QuizCard({ question, options, feedback, onComplete }: QuizProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (opt: QuizOption) => {
    if (answered) return;
    setSelected(opt.id);
    setAnswered(true);
    onComplete?.(opt.correct);
  };

  const isCorrect = selected ? options.find(o => o.id === selected)?.correct : false;

  return (
    <div className="mt-6">
      <div className="text-[13px] font-semibold text-slate-700 mb-3">{question}</div>
      <div className="flex flex-col gap-2">
        {options.map(opt => {
          let style = "bg-white border-slate-200 text-slate-700";
          if (answered && opt.id === selected) {
            style = opt.correct
              ? "bg-emerald-50 border-emerald-400 text-emerald-800"
              : "bg-rose-50 border-rose-400 text-rose-800";
          } else if (answered && opt.correct) {
            style = "bg-emerald-50/50 border-emerald-200 text-emerald-700";
          }
          return (
            <button key={opt.id} onClick={() => handleSelect(opt)}
              disabled={answered}
              className={`w-full text-left px-4 py-3 rounded-xl border text-[13px] font-medium transition-all ${style} ${!answered ? "hover:border-slate-300 cursor-pointer" : "cursor-default"}`}>
              {opt.text}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`mt-3 p-3 rounded-xl text-[12px] leading-relaxed ${isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {isCorrect ? feedback.correct : feedback.incorrect}
        </div>
      )}
    </div>
  );
}
