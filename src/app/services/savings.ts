// This service manages all savings data in the application.

import { Injectable, computed, signal } from '@angular/core';
import { Challenge, CheckIn, Reflection } from '../models/challenge';

@Injectable({
  providedIn: 'root'
})
export class Savings {
  // These keys are used to save data inside browser LocalStorage.
  private readonly challengesKey = 'micro-savings-challenges';
  private readonly checkInsKey = 'micro-savings-check-ins';
  private readonly reflectionsKey = 'micro-savings-reflections';

  // These signals hold the application state.
  private readonly challengesSignal = signal<Challenge[]>(
    this.loadData<Challenge[]>(this.challengesKey, [])
  );

  private readonly checkInsSignal = signal<CheckIn[]>(
    this.loadData<CheckIn[]>(this.checkInsKey, [])
  );

  private readonly reflectionsSignal = signal<Reflection[]>(
    this.loadData<Reflection[]>(this.reflectionsKey, [])
  );

  // Components can read these signals but cannot change them directly.
  readonly challenges = this.challengesSignal.asReadonly();
  readonly checkIns = this.checkInsSignal.asReadonly();
  readonly reflections = this.reflectionsSignal.asReadonly();

  // This function reads saved data from LocalStorage.
  private loadData<T>(key: string, fallbackValue: T): T {
    try {
      const savedValue = localStorage.getItem(key);

      // Return fallback data when there is no saved value.
      if (!savedValue) {
        return fallbackValue;
      }

      return JSON.parse(savedValue) as T;
    } catch {
      // Return fallback data if saved data cannot be read.
      return fallbackValue;
    }
  }

  // This function saves a value to LocalStorage.
  private saveData<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // This function creates and saves a new challenge.
  addChallenge(challenge: Challenge): void {
    this.challengesSignal.update((currentChallenges) => [
      challenge,
      ...currentChallenges
    ]);

    this.saveData(this.challengesKey, this.challengesSignal());
  }

  // This function finds one challenge using its ID.
  getChallengeById(challengeId: string) {
    return computed(() =>
      this.challenges().find((challenge) => challenge.id === challengeId)
    );
  }

  // This function creates a new check-in or updates an existing check-in.
  saveCheckIn(checkIn: CheckIn): void {
    this.checkInsSignal.update((currentCheckIns) => {
      const existingIndex = currentCheckIns.findIndex(
        (item) =>
          item.challengeId === checkIn.challengeId &&
          item.date === checkIn.date
      );

      // Replace the old check-in if the same date already exists.
      if (existingIndex >= 0) {
        const updatedCheckIns = [...currentCheckIns];
        updatedCheckIns[existingIndex] = checkIn;
        return updatedCheckIns;
      }

      // Add a new check-in when there is no record for that date.
      return [checkIn, ...currentCheckIns];
    });

    this.saveData(this.checkInsKey, this.checkInsSignal());
  }

  // This function returns all check-ins for one challenge.
  getCheckInsByChallengeId(challengeId: string) {
    return computed(() =>
      this.checkIns()
        .filter((checkIn) => checkIn.challengeId === challengeId)
        .sort((first, second) => second.date.localeCompare(first.date))
    );
  }

  // This function creates or updates the reflection for one challenge.
  saveReflection(reflection: Reflection): void {
    this.reflectionsSignal.update((currentReflections) => {
      const existingIndex = currentReflections.findIndex(
        (item) => item.challengeId === reflection.challengeId
      );

      // Replace the old reflection if it exists.
      if (existingIndex >= 0) {
        const updatedReflections = [...currentReflections];
        updatedReflections[existingIndex] = reflection;
        return updatedReflections;
      }

      // Add a reflection when none exists yet.
      return [reflection, ...currentReflections];
    });

    this.saveData(this.reflectionsKey, this.reflectionsSignal());
  }

  // This function returns the reflection for one challenge.
  getReflectionByChallengeId(challengeId: string) {
    return computed(() =>
      this.reflections().find(
        (reflection) => reflection.challengeId === challengeId
      )
    );
  }

  // This function calculates dashboard statistics for one challenge.
  getStatsByChallengeId(challengeId: string) {
    return computed(() => {
      const checkIns = this.getCheckInsByChallengeId(challengeId)();
      const savedCheckIns = checkIns.filter((checkIn) => checkIn.saved);

      // Calculate total money saved from successful check-ins.
      const totalSaved = savedCheckIns.reduce(
        (total, checkIn) => total + (checkIn.actualAmount ?? 0),
        0
      );

      // Calculate how often the user completed a check-in successfully.
      const successRate =
        checkIns.length === 0
          ? 0
          : (savedCheckIns.length / checkIns.length) * 100;

      // Calculate the latest and longest saving streaks.
      const streaks = this.calculateStreaks(checkIns);

      return {
        totalSaved,
        totalCheckIns: checkIns.length,
        savedCheckIns: savedCheckIns.length,
        successRate,
        currentStreak: streaks.current,
        longestStreak: streaks.longest
      };
    });
  }

  // This function calculates current and longest consecutive saving streaks.
  private calculateStreaks(checkIns: CheckIn[]): {
    current: number;
    longest: number;
  } {
    let current = 0;
    let longest = 0;
    let activeRun = 0;

    // Read records from newest to oldest.
    for (const checkIn of checkIns) {
      if (checkIn.saved) {
        activeRun += 1;
        longest = Math.max(longest, activeRun);
      } else {
        activeRun = 0;
      }
    }

    // Count only the successful records at the top as current streak.
    for (const checkIn of checkIns) {
      if (!checkIn.saved) {
        break;
      }

      current += 1;
    }

    return { current, longest };
  }
}