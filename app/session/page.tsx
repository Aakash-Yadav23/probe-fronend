'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// Use your original logic here
// Reuse the bulk of the code from your original `ProbeInterview`,
// but remove the session start logic and use `sessionResponseId` directly.

const ChatPage = () => {
  const searchParams = useSearchParams();
  const sessionResponseId = searchParams.get('sessionResponseId');
  const respondentId = searchParams.get('respondentId');

  const API_BASE_URL = 'http://localhost:3001';

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    const fetchInitialQuestion = async () => {
      if (!sessionResponseId) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/reply/resume/${sessionResponseId}`
        );
        const data = await res.json();
        setCurrentQuestion(data.firstQuestion);
        setConversation([
          {
            type: 'question',
            content: `Q${data.questionNumber}. ${data.firstQuestion}`,
          },
        ]);
      } catch (err) {
        alert('Failed to fetch initial question.');
      }
    };

    fetchInitialQuestion();
  }, [sessionResponseId]);

  const submitAnswer = async () => {
    if (!answer.trim()) return;

    setIsLoading(true);
    const userAnswer = answer;
    setAnswer('');

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chat/reply/${sessionResponseId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer: userAnswer }),
        }
      );
      const data = await res.json();

      if (res.ok) {
        setConversation((prev) => [
          ...prev,
          { type: 'answer', content: userAnswer },
          {
            type: 'question',
            content: `Q${data.questionNumber}. ${data.nextQuestion}`,
          },
        ]);
        setCurrentQuestion(data.nextQuestion);
        setSessionComplete(data.complete);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error submitting answer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 p-4">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
        {respondentId && (
          <p className="text-sm mb-2 text-gray-500">
            Respondent ID: {respondentId}
          </p>
        )}
        <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${
                msg.type === 'question' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
            >
              <p className="text-gray-700">{msg.content}</p>
            </div>
          ))}
        </div>

        {!sessionComplete && (
          <div>
            <textarea
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Type your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isLoading}
            />
            <button
              onClick={submitAnswer}
              disabled={isLoading || !answer.trim()}
              className="mt-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit Answer
            </button>
          </div>
        )}

        {sessionComplete && (
          <div className="text-center mt-6 text-green-700 font-semibold">
            🎉 Session Complete!
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
