import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import QuizCard from "../../components/learn/QuizCard";
import ProgressTracker from "../../components/learn/ProgressTracker";
import { UNIVERSES } from "../../data/universData";

export default function UniversePathPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const universe = UNIVERSES.find(u => u.id === id);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizDone, setQuizDone] = useState(false);

  if (!universe) return <div className="p-8 text-center text-slate-400">Univers non trouve</div>;

  const step = universe.steps[currentStep];
  const isLast = currentStep === universe.steps.length - 1;
  const allDone = completedSteps.size === universe.steps.length;

  const completeStep = () => {
    setCompletedSteps(prev => new Set(prev).add(step.id));
    setQuizDone(true);
  };

  const goNext = () => {
    if (!isLast) {
      setCurrentStep(prev => prev + 1);
      setShowQuiz(false);
      setQuizDone(false);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setShowQuiz(false);
      setQuizDone(completedSteps.has(universe.steps[currentStep - 1]?.id));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-slate-200/60">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/explore")}><ChevronLeft className="h-5 w-5 text-slate-400" /></button>
          <span className="text-[15px] font-semibold text-slate-800">{universe.name}</span>
          <div className="w-5" />
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pb-10 pt-4">
        <ProgressTracker current={completedSteps.size} total={universe.steps.length} label={`Etape ${currentStep + 1} sur ${universe.steps.length}`} />

        {/* Step navigation dots */}
        <div className="flex justify-center gap-1.5 mt-4 mb-6">
          {universe.steps.map((s, i) => (
            <button key={s.id} onClick={() => { setCurrentStep(i); setShowQuiz(false); setQuizDone(completedSteps.has(s.id)); }}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: i === currentStep ? universe.color : completedSteps.has(s.id) ? `${universe.color}40` : "#e2e8f0" }} />
          ))}
        </div>

        {/* Step card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${universe.color}12` }}>
                {step.icon}
              </div>
              <div>
                <div className="text-[15px] font-semibold text-slate-800">{step.title}</div>
                <div className="text-[12px] font-medium" style={{ color: universe.color }}>Etape {currentStep + 1}</div>
              </div>
            </div>

            {/* Rule */}
            <div className="p-3 rounded-xl mb-4" style={{ background: `${universe.color}08`, borderLeft: `3px solid ${universe.color}` }}>
              <div className="text-[13px] font-semibold text-slate-700">{step.rule}</div>
            </div>

            {/* Explanation */}
            <p className="text-[13px] text-slate-600 leading-relaxed">{step.explanation}</p>

            {/* Quiz */}
            {!quizDone && !showQuiz && (
              <button onClick={() => setShowQuiz(true)}
                className="w-full mt-5 py-2.5 rounded-xl text-[13px] font-medium"
                style={{ background: `${universe.color}10`, color: universe.color }}>
                Tester ma comprehension
              </button>
            )}
            {showQuiz && !quizDone && (
              <QuizCard question={step.quiz.question} options={step.quiz.options} feedback={step.quiz.feedback} onComplete={completeStep} />
            )}

            {/* Action (after quiz) */}
            {quizDone && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">Ton action</div>
                <div className="text-[12px] text-emerald-600 leading-relaxed">{step.action}</div>
                {step.ficheSlug && (
                  <button onClick={() => navigate(`/learn/fiche/${step.ficheSlug}`)}
                    className="mt-2 text-[11px] font-medium text-emerald-700 underline">
                    En savoir plus →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 pt-2 border-t border-slate-100">
            <button onClick={goPrev} disabled={currentStep === 0}
              className="flex items-center gap-1 text-[13px] text-slate-500 disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" /> Precedent
            </button>
            {quizDone && !isLast && (
              <button onClick={goNext}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: universe.color }}>
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {quizDone && isLast && (
              <button onClick={() => navigate("/learn/simulateur")}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-emerald-600">
                Simulateur →
              </button>
            )}
          </div>
        </div>

        {allDone && (
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50/80 border border-emerald-100 text-center">
            <div className="text-lg mb-1">🎓</div>
            <div className="text-[15px] font-semibold text-slate-800">Parcours termine !</div>
            <div className="text-[13px] text-slate-500 mt-1">Tu maitrises les bases de {universe.name.toLowerCase()}.</div>
          </div>
        )}
      </div>
    </div>
  );
}
