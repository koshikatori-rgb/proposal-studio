'use client';

import { useRouter } from 'next/navigation';

type Step = {
  number: number;
  label: string;
  path: string;
};

type StepIndicatorProps = {
  proposalId: string;
  currentStep: 1 | 2 | 3 | 4;
};

const steps: Step[] = [
  { number: 1, label: 'AI対話', path: 'chat' },
  { number: 2, label: '言語化確認', path: 'review' },
  { number: 3, label: 'ドラフト確認', path: 'draft' },
  { number: 4, label: 'エクスポート', path: 'export' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  proposalId,
  currentStep,
}) => {
  const router = useRouter();

  const handleStepClick = (step: Step) => {
    router.push(`/proposal/${proposalId}/${step.path}`);
  };

  return (
    <div className="mb-12">
      <div className="flex items-center gap-6">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;

          return (
            <div key={step.number} className="contents">
              {/* ステップ */}
              <button
                onClick={() => handleStepClick(step)}
                className="flex items-center group cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center font-medium text-xs transition-colors ${
                    isActive || isCompleted
                      ? 'bg-black text-white'
                      : 'border border-gray-300 text-gray-400 group-hover:border-gray-500 group-hover:text-gray-600'
                  }`}
                >
                  {isCompleted ? '✓' : step.number}
                </div>
                <span
                  className={`ml-3 text-xs font-medium tracking-wide transition-colors ${
                    isActive
                      ? 'text-black'
                      : isCompleted
                      ? 'text-gray-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {/* 線（最後のステップ以外） */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-gray-300"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
