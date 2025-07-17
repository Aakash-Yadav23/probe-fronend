'use client';
import React, { useState } from 'react';
import {
  Send,
  MessageCircle,
  CheckCircle,
  XCircle,
  Target,
  Hash,
} from 'lucide-react';

// Define types for conversation messages and session data

type ConversationMessage = {
  type: 'question' | 'answer';
  content: string;
};

type SessionData = {
  topic: string;
  probesAsked: number;
  numberOfProbes: number;
  completeness: number;
  firstQuestion?: string;
};

const ProbeInterview = () => {
  const [sessionId, setSessionId] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [startingQuestionNumber, setStartingQuestionNumber] = useState(0);

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [lastSatisfactoryScore, setLastSatisfactoryScore] = useState<
    number | null
  >(null);
  const [respondentId, setRespondentId] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);

  const API_BASE_URL = 'http://43.205.240.108:3001'; // Adjust this to your backend URL
  // const API_BASE_URL = 'http://localhost:3001'; // Adjust t÷his to your backend URL

  const startProbe = async () => {
    if (!sessionId.trim()) {
      alert('Please enter a session ID');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/start-probe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSessionData(data);
        setCurrentQuestion(data.firstQuestion);
        setRespondentId(data.respondentId);
        setStartingQuestionNumber(data.questionNumber);
        setQuestionNumber(data.questionNumber);
        setConversation([
          {
            type: 'question',
            content: `Q${data.questionNumber}. ${data.firstQuestion}`,
          },
        ]);
        setSessionComplete(false);
      } else {
        alert(data.error || 'Failed to start probe');
      }
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
      }
      alert('Error connecting to server: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert('Please enter an answer');
      return;
    }

    setIsLoading(true);
    const userAnswer = answer;
    setAnswer('');

    try {
      const response = await fetch(`${API_BASE_URL}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, answer: userAnswer }),
      });

      const data = await response.json();

      console.log('response', data);

      if (response.ok) {
        // Add user answer to conversation
        const nextQuestionNumber = questionNumber + 1;
        setQuestionNumber(nextQuestionNumber);

        setConversation((prev) => [
          ...prev,
          { type: 'answer', content: userAnswer },
          {
            type: 'question',
            content: `Q${nextQuestionNumber}. ${data.nextQuestion}`,
          },
        ]);

        setCurrentQuestion(data.nextQuestion);
        setSessionComplete(data.complete);
        setTotalScore(data.totalScore);
        setLastSatisfactoryScore(data.satisfactoryPercent);
        setRespondentId(data.respondentId); // <-- Add this line

        // Update session data with current progress
        if (sessionData) {
          setSessionData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              probesAsked: data.probesAsked,
            } as SessionData;
          });
        }
      } else {
        alert(data.error || 'Failed to submit answer');
      }
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
      }
      alert('Error connecting to server: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentQuestion && !sessionComplete) {
        submitAnswer();
      } else if (!currentQuestion) {
        startProbe();
      }
    }
  };

  const resetSession = () => {
    setSessionId('');
    setCurrentQuestion('');
    setAnswer('');
    setConversation([]);
    setTotalScore(0);
    setSessionComplete(false);
    setSessionData(null);
    setLastSatisfactoryScore(null);
    setRespondentId(null);
    setQuestionNumber(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="text-blue-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-800">
              Probe Interview
            </h1>
          </div>
          {respondentId && (
            <div className="mb-2 text-sm text-gray-500">
              Respondent ID: <span className="font-mono">{respondentId}</span>
            </div>
          )}

          {sessionData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Topic
                  </span>
                </div>
                <p className="text-blue-900 font-semibold">
                  {sessionData.topic}
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Probes
                  </span>
                </div>
                <p className="text-green-900 font-semibold">
                  {sessionData.probesAsked || 0}/{sessionData.numberOfProbes}
                </p>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    Required
                  </span>
                </div>
                <p className="text-purple-900 font-semibold">
                  {sessionData.completeness}%
                </p>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    Score
                  </span>
                </div>
                <p className="text-orange-900 font-semibold">{totalScore}</p>
              </div>
            </div>
          )}
        </div>

        {/* Session ID Input */}
        {!currentQuestion && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-black mb-4">
              Start Interview Session
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter session ID"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                disabled={isLoading}
              />
              <button
                onClick={startProbe}
                disabled={isLoading || !sessionId.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? 'Starting...' : 'Start Probe'}
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Conversation */}
        {conversation.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Conversation
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversation.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.type === 'question'
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'bg-gray-50 border-l-4 border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'question' ? (
                      <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 bg-gray-400 rounded-full mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {message.type === 'question' ? 'Interviewer' : 'You'}
                      </p>
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answer Input */}
        {currentQuestion && !sessionComplete && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Your Answer
            </h2>
            <div className="space-y-3">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                disabled={isLoading}
              />
              <div className="flex gap-3">
                <button
                  onClick={submitAnswer}
                  disabled={isLoading || !answer.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? 'Submitting...' : 'Submit Answer'}
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={resetSession}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  New Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Complete */}
        {sessionComplete && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              {typeof lastSatisfactoryScore === 'number' ? (
                lastSatisfactoryScore >= (sessionData?.completeness || 0) ? (
                  <div className="text-green-600">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">
                      Session Complete!
                    </h2>
                    <p className="text-gray-600">
                      You achieved a satisfactory score of{' '}
                      {lastSatisfactoryScore}%
                    </p>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <XCircle className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Session Ended</h2>
                    <p className="text-gray-600">
                      You achieved {lastSatisfactoryScore}% but needed{' '}
                      {sessionData?.completeness}%
                    </p>
                  </div>
                )
              ) : (
                <div className="text-gray-600">
                  <h2 className="text-2xl font-bold mb-2">Session Ended</h2>
                  <p>No score available for this session.</p>
                </div>
              )}
              <button
                onClick={resetSession}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                Start New Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProbeInterview;
