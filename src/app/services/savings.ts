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

  // This function calculates current and longest streaks using calendar dates.
  private calculateStreaks(checkIns: CheckIn[]): {
    current: number;
    longest: number;
  } {
    // Sort records from oldest to newest for longest streak calculation.
    const oldestFirst = [...checkIns].sort((first, second) =>
      first.date.localeCompare(second.date)
    );

    let longest = 0;
    let activeRun = 0;
    let previousSavedDate: string | null = null;

    // Calculate the longest consecutive sequence of saved calendar days.
    for (const checkIn of oldestFirst) {
      // A not-saved record always breaks the active streak.
      if (!checkIn.saved) {
        activeRun = 0;
        previousSavedDate = null;
        continue;
      }

      // Start a new streak when this is the first saved record.
      if (!previousSavedDate) {
        activeRun = 1;
        previousSavedDate = checkIn.date;
        longest = Math.max(longest, activeRun);
        continue;
      }

      const dayDifference = this.getCalendarDayDifference(
        previousSavedDate,
        checkIn.date
      );

      // Continue streak only when this record is exactly the next calendar day.
      if (dayDifference === 1) {
        activeRun += 1;
      } else {
        // Start a new streak after a gap or duplicate date.
        activeRun = 1;
      }

      previousSavedDate = checkIn.date;
      longest = Math.max(longest, activeRun);
    }

    // Sort records from newest to oldest for current streak calculation.
    const newestFirst = [...checkIns].sort((first, second) =>
      second.date.localeCompare(first.date)
    );

    let current = 0;
    let expectedDate = this.getTodayDate();

    // Allow a streak to continue from yesterday when today has no record yet.
    const newestRecord = newestFirst[0];
    if (newestRecord && newestRecord.date !== expectedDate) {
      const differenceFromToday = this.getCalendarDayDifference(
        newestRecord.date,
        expectedDate
      );

      // Start from the newest record only when it was saved yesterday.
      if (differenceFromToday === 1) {
        expectedDate = newestRecord.date;
      } else {
        return { current: 0, longest };
      }
    }

    // Count saved records that match each expected calendar day.
    for (const checkIn of newestFirst) {
      // Ignore records newer than the date currently being checked.
      if (checkIn.date > expectedDate) {
        continue;
      }

      // Stop when a record does not match the expected calendar day.
      if (checkIn.date !== expectedDate) {
        break;
      }

      // Stop when the expected day was not saved.
      if (!checkIn.saved) {
        break;
      }

      current += 1;
      expectedDate = this.getPreviousDate(expectedDate);
    }

    return { current, longest };
  }

  // This function returns today's date using local calendar values.
  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // This function returns the date one calendar day before a given date.
  private getPreviousDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);

    // Create the date at UTC midnight to avoid timezone changes.
    const utcDate = new Date(Date.UTC(year, month - 1, day));

    // Move the date backward by one calendar day.
    utcDate.setUTCDate(utcDate.getUTCDate() - 1);

    return utcDate.toISOString().slice(0, 10);
  }

  // This function returns the number of calendar days between two date strings.
  private getCalendarDayDifference(firstDate: string, secondDate: string): number {
    const [firstYear, firstMonth, firstDay] = firstDate.split('-').map(Number);
    const [secondYear, secondMonth, secondDay] = secondDate.split('-').map(Number);

    // Convert both date-only values to UTC midnight timestamps.
    const firstTimestamp = Date.UTC(firstYear, firstMonth - 1, firstDay);
    const secondTimestamp = Date.UTC(secondYear, secondMonth - 1, secondDay);

    // Divide millisecond difference by one calendar day.
    return Math.round(
      (secondTimestamp - firstTimestamp) / (1000 * 60 * 60 * 24)
    );
  }

  // This function deletes a challenge and all data connected to it.
  deleteChallenge(challengeId: string): void {
    // Remove the selected challenge from the challenges list.
    this.challengesSignal.update((currentChallenges) =>
      currentChallenges.filter((challenge) => challenge.id !== challengeId)
    );

    // Remove every check-in record connected to the deleted challenge.
    this.checkInsSignal.update((currentCheckIns) =>
      currentCheckIns.filter((checkIn) => checkIn.challengeId !== challengeId)
    );

    // Remove the reflection connected to the deleted challenge.
    this.reflectionsSignal.update((currentReflections) =>
      currentReflections.filter(
        (reflection) => reflection.challengeId !== challengeId
      )
    );

    // Save all updated lists to LocalStorage.
    this.saveData(this.challengesKey, this.challengesSignal());
    this.saveData(this.checkInsKey, this.checkInsSignal());
    this.saveData(this.reflectionsKey, this.reflectionsSignal());
  }

  // This function updates one existing challenge and saves the new data.
  updateChallenge(updatedChallenge: Challenge): void {
    this.challengesSignal.update((currentChallenges) =>
      currentChallenges.map((challenge) =>
        challenge.id === updatedChallenge.id
          ? updatedChallenge
          : challenge
      )
    );

    // Save the updated challenge list to LocalStorage.
    this.saveData(this.challengesKey, this.challengesSignal());
  }
}