"use client";

type QuickQuestionsProps = {
  questions: string[];
  disabled?: boolean;
  onPick: (question: string) => void;
};

export function QuickQuestions({ questions, disabled, onPick }: QuickQuestionsProps) {
  return (
    <div className="chat-quick" role="list">
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          role="listitem"
          disabled={disabled}
          onClick={() => onPick(question)}
        >
          {question}
        </button>
      ))}
    </div>
  );
}
