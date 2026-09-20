// This component lets the user create a new savings challenge.

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Challenge } from '../../models/challenge';
import { Savings } from '../../services/savings';

@Component({
  selector: 'app-setup-challenge',
  imports: [FormsModule],
  templateUrl: './setup-challenge.html',
  styleUrl: './setup-challenge.css'
})
export class SetupChallenge {
  // Router is used to return home or open the new challenge page.
  private readonly router = inject(Router);

  // Savings service is used to save the new challenge.
  private readonly savingsService = inject(Savings);

  // These fields store values entered by the user in the form.
  name = '';
  amount: number | null = null;
  period: 'daily' | 'weekly' = 'daily';
  startDate = this.getTodayDate();
  targetDays: number | null = 30;
  targetAmount: number | null = null;
  currency = 'LKR';

  // This function returns today's date in YYYY-MM-DD format.
  private getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // This function validates the form, saves the challenge, and opens its detail page.
  createChallenge(): void {
    // Stop the process when required values are missing or invalid.
    if (!this.name.trim() || !this.amount || this.amount <= 0) {
      alert('Please enter a challenge name and a valid saving amount.');
      return;
    }

    const challenge: Challenge = {
      // This function creates a unique ID for the new challenge.
      id: crypto.randomUUID(),

      // This removes extra spaces from the challenge name.
      name: this.name.trim(),

      amount: this.amount,
      period: this.period,
      startDate: this.startDate,

      // Optional values are saved only when the user enters them.
      targetDays: this.targetDays && this.targetDays > 0
        ? this.targetDays
        : undefined,

      targetAmount: this.targetAmount && this.targetAmount > 0
        ? this.targetAmount
        : undefined,

      currency: this.currency,

      // This records when the challenge was created.
      createdAt: new Date().toISOString()
    };

    // This function saves the new challenge through the service.
    this.savingsService.addChallenge(challenge);

    // This function opens the newly created challenge page.
    this.router.navigate(['/challenge', challenge.id]);
  }

  // This function cancels creation and returns to the home page.
  cancel(): void {
    this.router.navigate(['/']);
  }
}