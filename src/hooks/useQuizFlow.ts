/**
 * hooks/useQuizFlow.ts
 * Shared hook đóng gói quiz flow chung cho Grammar, Reading, Listening.
 *
 * Quản lý: question index, answer state, check/next/complete flow,
 * confetti + sound side effects, và lesson progress mutation.
 */

import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAddLessonProgressMutation } from './useApi';
import { sounds } from '../services/sounds';
import type { LessonProgress } from '../types';

interface UseQuizFlowOptions {
  totalQuestions: number;
  lessonSlug: string;
  lessonType: LessonProgress['type'];
  /** Called when all questions are done (after confetti). Use to set page-level mode. */
  onComplete: () => void;
}

interface UseQuizFlowReturn {
  currentQuestionIndex: number;
  isCorrect: boolean | null;
  /** Advance to next question or complete if last. Resets answer state. */
  nextQuestion: () => void;
  /** Mark current answer correct + play sound. */
  markCorrect: () => void;
  /** Mark current answer incorrect + play sound. */
  markIncorrect: () => void;
  /** Reset answer state without advancing (e.g. user retries). */
  resetAnswer: () => void;
}

export function useQuizFlow({
  totalQuestions,
  lessonSlug,
  lessonType,
  onComplete,
}: UseQuizFlowOptions): UseQuizFlowReturn {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const addProgressMutation = useAddLessonProgressMutation();

  const completeLesson = useCallback(() => {
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#000000', '#bef264', '#fde047', '#f87171'],
    });
    addProgressMutation.mutate({
      id: lessonSlug,
      type: lessonType,
      completedAt: new Date().toISOString(),
    });
    onComplete();
  }, [lessonSlug, lessonType, addProgressMutation, onComplete]);

  const nextQuestion = useCallback(() => {
    setIsCorrect(null);
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      completeLesson();
    }
  }, [currentQuestionIndex, totalQuestions, completeLesson]);

  const markCorrect = useCallback(() => {
    setIsCorrect(true);
    sounds.correct();
  }, []);

  const markIncorrect = useCallback(() => {
    setIsCorrect(false);
    sounds.incorrect();
  }, []);

  const resetAnswer = useCallback(() => {
    setIsCorrect(null);
  }, []);

  return {
    currentQuestionIndex,
    isCorrect,
    nextQuestion,
    markCorrect,
    markIncorrect,
    resetAnswer,
  };
}
