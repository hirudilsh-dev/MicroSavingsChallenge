// This component lets the user save or update today's check-in.

import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckIn as CheckInModel } from '../../../models/challenge';
import { Savings } from '../../../services/savings';

@Component({
  selector: 'app-check-in',
  imports: [FormsModule],
  templateUrl: './check-in.html',
  styleUrl: './check-in.css'
})
export class CheckIn {
  // This required input receives the selected challenge ID from the parent.
  readonly challengeId = input.required<string>();

  // Savings service gives this component access to data and save functions.
  private readonly savingsService = inject(Savings);

  // This signal controls whether the user saved money for this check-in.
  readonly saved = signal(true);

  // This signal stores the amount saved by the user.
  readonly amount = signal<number | null>(null);

  // This signal stores an optional reason when the user did not save.
  readonly reason = signal('');

  // This signal shows a short success message after saving.
  readonly showSuccessMessage = signal(false);

  // This value stores today's date in YYYY-MM-DD format.
  readonly today = this.getTodayDate();

  // This getter returns the selected challenge after the parent provides challengeId.
  get challenge() {
    return this.savingsService.getChallengeById(this.challengeId());
  }

  // This getter returns all check-ins after the parent provides challengeId.
  get checkIns() {
    return this.savingsService.getCheckInsByChallengeId(this.challengeId());
  }

  // This computed signal finds today's existing check-in if it exists.
  readonly todayCheckIn = computed(() =>
    this.checkIns().find((checkIn) => checkIn.date === this.today)
  );

  constructor() {
    // This effect reloads form values when challenge data or today's record changes.
    effect(() => {
      this.loadTodayValues();
    });
  }

  // This function creates a local date string without timezone changes.
  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // This function loads an existing check-in or uses the challenge amount as default.
  private loadTodayValues(): void {
    const existingCheckIn = this.todayCheckIn();
    const selectedChallenge = this.challenge();

    // Load saved values when the user already checked in today.
    if (existingCheckIn) {
      this.saved.set(existingCheckIn.saved);
      this.amount.set(existingCheckIn.actualAmount ?? null);
      this.reason.set(existingCheckIn.reason ?? '');
      return;
    }

    // Use the planned amount for a new successful check-in.
    if (selectedChallenge && this.amount() === null) {
      this.amount.set(selectedChallenge.amount);
    }
  }

  // This function changes the form to the "saved money" state.
  chooseSaved(): void {
    this.saved.set(true);
    this.reason.set('');

    // Use the planned amount if the amount field is empty.
    if (this.amount() === null) {
      this.amount.set(this.challenge()?.amount ?? null);
    }
  }

  // This function changes the form to the "did not save" state.
  chooseNotSaved(): void {
    this.saved.set(false);
    this.amount.set(null);
  }

  // This function updates the saved amount from the input field.
  updateAmount(value: number | null): void {
    this.amount.set(value);
  }

  // This function updates the reason text from the input field.
  updateReason(value: string): void {
    this.reason.set(value);
  }

  // This function validates and saves today's check-in.
  saveTodayCheckIn(): void {
    const selectedChallenge = this.challenge();

    // Stop when the selected challenge cannot be found.
    if (!selectedChallenge) {
      return;
    }

    const savedAmount = this.amount();

    // Stop when the user selected "saved" but entered an invalid amount.
    if (this.saved() && (savedAmount === null || savedAmount <= 0)) {
      alert('Please enter a valid saved amount.');
      return;
    }

    const checkIn: CheckInModel = {
      // Keep the existing ID when updating today's record.
      id: this.todayCheckIn()?.id ?? crypto.randomUUID(),

      challengeId: this.challengeId(),
      date: this.today,
      saved: this.saved(),

      // Save amount only when the user saved money.
      actualAmount: this.saved() ? savedAmount ?? selectedChallenge.amount : undefined,

      // Save reason only when the user did not save money.
      reason: this.saved() ? undefined : this.reason().trim() || undefined,

      updatedAt: new Date().toISOString()
    };

    // This function saves the new or updated record through the service.
    this.savingsService.saveCheckIn(checkIn);

    // This function shows a confirmation message after saving.
    this.showSuccessMessage.set(true);

    // This function hides the confirmation message after three seconds.
    window.setTimeout(() => {
      this.showSuccessMessage.set(false);
    }, 3000);
  }
}