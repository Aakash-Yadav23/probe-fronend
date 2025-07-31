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
import axios from 'axios';

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
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState('');
  const [numberOfProbes, setNumberOfProbes] = useState(10);
  const [respondentIdInput, setRespondentIdInput] = useState('');
  const [priority, setPriority] = useState<'probes' | 'completeness'>('probes');
  const [questionNumberInput, setQuestionNumberInput] = useState(1);
  const [completenessRequired, setCompletenessRequired] = useState(80);
  const [firstQuestion, setFirstQuestion] = useState('');

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionCompletenessRequired, setSessionCompletenessRequired] =
    useState(0);

  const [startingQuestionNumber, setStartingQuestionNumber] = useState(0);

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [lastSatisfactoryScore, setLastSatisfactoryScore] = useState<
    number | null
  >(null);
  const [respondentId, setRespondentId] = useState<string | null>(null);
  const [sessionResponseId, setSessionResponseId] = useState<string | null>(
    null
  );

  const [questionNumber, setQuestionNumber] = useState(0);
  // const [questionScore, setQuestionScore] = useState<number | null>(null);
  const [requiredScore, setRequiredScore] = useState<number | null>(null);

  const API_BASE_URL = 'http://43.205.240.108:3001'; // Adjust this to your backend URL
  // const API_BASE_URL = 'http://localhost:3001'; // Adjust t÷his to your backend URL

  const startProbe = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic');
      return;
    }

    if (!objective.trim()) {
      alert('Please enter an objective');
      return;
    }

    if (!respondentIdInput.trim()) {
      alert('Please enter a respondent ID');
      return;
    }

    if (!firstQuestion.trim()) {
      alert('Please enter the first question');
      return;
    }

    setIsLoading(true);
    try {
      const requestBody = {
        topic: topic,
        objective: objective,
        numberOfProbes: numberOfProbes,
        respondentId: `respondent${respondentIdInput}`,
        priority: priority,
        questionNumber: questionNumberInput,
        completenessRequired: completenessRequired,
        firstQuestion: firstQuestion,
      };

      console.log('Request Body being sent to API:', requestBody);

      const response = await axios.post(
        `${API_BASE_URL}/api/chat/start-probe`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const data = response.data.data;

      console.log('API Response Data:', data);
      console.log('sessionResponseId from API:', data.sessionResponseId);

      setSessionData(data);
      setCurrentQuestion(data.firstQuestion);
      setRespondentId(data.respondentId);
      setStartingQuestionNumber(data.questionNumber);
      setQuestionNumber(data.questionNumber);
      setSessionCompletenessRequired(data.completenessRequired || 0);
      setSessionResponseId(data.sessionResponseId);

      setConversation([
        {
          type: 'question',
          content: `Q${data.questionNumber}. ${data.firstQuestion}`,
        },
      ]);
      setSessionComplete(false);
    } catch (error: any) {
      let message = 'Unknown error';
      if (axios.isAxiosError(error)) {
        if (error.response) {
          message = error.response.data?.error || error.response.statusText;
        } else if (error.request) {
          message = 'No response from server. Please check your connection.';
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      alert('Error: ' + message);
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
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/reply/${sessionResponseId}`,
        { answer: userAnswer },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const data = response.data.data;

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

      // Reset question score to 0 for the next question

      setCurrentQuestion(data.nextQuestion);
      setSessionComplete(data.complete);
      setRequiredScore(data.requiredScore);
      setRespondentId(data.respondentId);

      // Update total score by adding current question score to previous total
      setTotalScore((prevTotal) => prevTotal + (data.questionScore || 0));

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
    } catch (error: any) {
      console.log('Error', error);
      let message = 'Unknown error';
      if (error?.response?.data?.message) {
        message = error?.response?.data?.message;
      } else if (axios.isAxiosError(error)) {
        if (error.response) {
          message = error.response.data?.error || error.response.statusText;
        } else if (error.request) {
          message = 'No response from server. Please check your connection.';
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      alert('Error: ' + message);
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
    setTopic('');
    setObjective('');
    setNumberOfProbes(10);
    setRespondentIdInput('');
    setPriority('probes');
    setQuestionNumberInput(1);
    setCompletenessRequired(80);
    setFirstQuestion('');
    setCurrentQuestion('');
    setAnswer('');
    setConversation([]);
    setTotalScore(0);
    setSessionComplete(false);
    setSessionData(null);
    setLastSatisfactoryScore(null);
    setRespondentId(null);
    setQuestionNumber(0);
    setRequiredScore(null);
  };

  console.log('topic', topic);
  console.log('objective', objective);
  console.log('respondentIdInput', respondentIdInput);
  console.log('respondentId (from API)', respondentId);
  console.log('numberOfProbes', numberOfProbes);
  console.log('questionNumberInput', questionNumberInput);
  console.log('questionNumber (from API)', questionNumber);
  console.log('completenessRequired', completenessRequired);
  console.log('priority', priority);
  console.log('firstQuestion', firstQuestion);

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
                  {sessionCompletenessRequired}%
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

        {/* Session Configuration Form */}
        {!currentQuestion && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-black mb-4">
              Start Interview Session
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter topic"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objective *
                </label>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Enter objective"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Respondent ID *
                </label>
                <input
                  type="text"
                  value={respondentIdInput}
                  onChange={(e) => setRespondentIdInput(e.target.value)}
                  placeholder="Enter respondent ID (will be prefixed with 'respondent')"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  disabled={isLoading}
                />
                {respondentIdInput && (
                  <p className="text-xs text-gray-500 mt-1">
                    Will be sent as: respondent{respondentIdInput}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Probes
                </label>
                <input
                  type="number"
                  value={numberOfProbes}
                  onChange={(e) =>
                    setNumberOfProbes(parseInt(e.target.value) || 10)
                  }
                  min="1"
                  max="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Number
                </label>
                <input
                  type="number"
                  value={questionNumberInput}
                  onChange={(e) =>
                    setQuestionNumberInput(parseInt(e.target.value) || 1)
                  }
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completeness Required (%)
                </label>
                <input
                  type="number"
                  value={completenessRequired}
                  onChange={(e) =>
                    setCompletenessRequired(parseInt(e.target.value) || 80)
                  }
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as 'probes' | 'completeness')
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  disabled={isLoading}
                >
                  <option value="probes">Probes</option>
                  <option value="completeness">Completeness</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Question *
              </label>
              <textarea
                value={firstQuestion}
                onChange={(e) => setFirstQuestion(e.target.value)}
                placeholder="Enter the first question to ask"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black resize-none"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={startProbe}
                disabled={
                  isLoading ||
                  !priority.trim() ||
                  !completenessRequired ||
                  !questionNumberInput ||
                  !numberOfProbes ||
                  !topic.trim() ||
                  !objective.trim() ||
                  !respondentIdInput.trim() ||
                  !firstQuestion.trim()
                }
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
