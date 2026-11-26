/**
 * hooks/useQuizFlow.ts
 * Shared hook đóng gói quiz flow chung cho Grammar, Reading, Listening.
 *
 * Quản lý: question index, answer state, check/next/complete flow,
 * confetti + sound side effects, và lesson progress mutation.
 */

import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  useAddLessonProgressMutation,
  useSessionProgress,
  useSaveSessionProgressMutation,
  useDeleteSessionProgressMutation,
} from './useApi';
import { sounds } from '../services/sounds';
import type { LessonProgress } from '../types';

interface UseQuizFlowOptions {
  totalQuestions: number;
  lessonId?: string;
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
  lessonId,
  lessonSlug,
  lessonType,
  onComplete,
}: UseQuizFlowOptions): UseQuizFlowReturn {
  const sessionId = lessonId || lessonSlug;
  const [localIndex, setLocalIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const { data: savedSession } = useSessionProgress(sessionId);
  const saveSessionMutation = useSaveSessionProgressMutation();
  const deleteSessionMutation = useDeleteSessionProgressMutation();
  const addProgressMutation = useAddLessonProgressMutation();

  const currentQuestionIndex =
    localIndex !== null
      ? localIndex
      : savedSession &&
          totalQuestions > 0 &&
          savedSession.currentIndex >= 0 &&
          savedSession.currentIndex < totalQuestions
        ? savedSession.currentIndex
        : 0;

  const completeLesson = useCallback(() => {
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#000000', '#bef264', '#fde047', '#f87171'],
    });
    if (sessionId) {
      deleteSessionMutation.mutate(sessionId);
    }
    addProgressMutation.mutate({
      id: lessonSlug,
      type: lessonType,
      completedAt: new Date().toISOString(),
    });
    onComplete();
  }, [sessionId, lessonSlug, lessonType, deleteSessionMutation, addProgressMutation, onComplete]);

  const nextQuestion = useCallback(() => {
    setIsCorrect(null);
    if (currentQuestionIndex < totalQuestions - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setLocalIndex(nextIndex);
      if (sessionId) {
        saveSessionMutation.mutate({
          id: sessionId,
          currentIndex: nextIndex,
          lastUpdated: new Date().toISOString(),
        });
      }
    } else {
      completeLesson();
    }
  }, [currentQuestionIndex, totalQuestions, sessionId, saveSessionMutation, completeLesson]);

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
