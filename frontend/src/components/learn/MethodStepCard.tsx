import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import QuizCard from "./QuizCard";
import type { MethodePrinciple } from "../../data/methodeData";

interface Props {
  principle: MethodePrinciple;
  completed: boolean;
  onComplete: () => void;
}

export default function MethodStepCard({ principle, completed, onComplete }: Props) {
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizDone, setQuizDone] = useState(completed);

  return (
    <div className="bg-white rounded-[18px] border border-slate-200 shadow-[0_2px_12px_rgba(2,6,23,0.04)] overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${principle.color}12` }}>
            {principle.icon}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-slate-800 leading-snug">
              {principle.title}
            </div>
            <div className="text-[12px] text-slate-500 mt-1">
              {principle.subtitle}
            </div>
          </div>
          {quizDone && (
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[12px]">
              ✓
            </div>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="px-5 pb-4">
        <p className="text-[13px] text-slate-600 leading-relaxed">
          {principle.explanation}
        </p>

        {/* Examples */}
        <div className="mt-3 flex flex-col gap-1.5">
          {Object.entries(principle.examples).map(([key, val]) => (
            <div key={key} className="flex items-start gap-2 text-[12px] text-slate-500">
              <span className="mt-0.5">
                {key === "food" ? "🍎" : key === "cosmetic" ? "🧴" : "🏠"}
              </span>
              <span>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz toggle */}
      {!quizDone && (
        <div className="px-5 pb-4">
          {!showQuiz ? (
            <button onClick={() => setShowQuiz(true)}
              className="w-full py-2.5 rounded-xl text-[13px] font-medium transition-colors"
              style={{ background: `${principle.color}10`, color: principle.color }}>
              Tester ma comprehension
            </button>
          ) : (
            <QuizCard
              question={principle.quiz.question}
              options={principle.quiz.options}
              feedback={principle.quiz.feedback}
              onComplete={() => { setQuizDone(true); onComplete(); }}
            />
          )}
        </div>
      )}

      {/* Action */}
      {quizDone && (
        <div className="px-5 pb-5">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">
              Ton action
            </div>
            <div className="text-[12px] text-emerald-600 leading-relaxed">
              {principle.action}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
